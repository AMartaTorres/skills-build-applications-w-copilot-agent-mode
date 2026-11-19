import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

function isObjectId(value: unknown): value is string {
  return typeof value === 'string' && mongoose.Types.ObjectId.isValid(value);
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Valid activity data is required');
  const { userId, teamId, type, minutes } = input as Record<string, unknown>;
  if (!isObjectId(userId) || !isObjectId(teamId)) throw httpError(400, 'Valid userId and teamId are required');
  if (typeof type !== 'string' || !type.trim()) throw httpError(400, 'Activity type is required');
  if (typeof minutes !== 'number' || !Number.isFinite(minutes) || minutes < 1) throw httpError(400, 'Minutes must be a positive number');

  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || user.role !== 'student') throw httpError(404, 'Student not found');
  if (!team) throw httpError(404, 'Team not found');

  const activity = await Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
  return activity.toObject();
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Team data is required');
  const { name, mascot, members = [] } = input as Record<string, unknown>;
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'Team name is required');
  if (!Array.isArray(members)) throw httpError(400, 'Team members must be an array');

  const memberIds: string[] = [];
  for (const member of members) {
    if (typeof member !== 'string' || !mongoose.Types.ObjectId.isValid(member)) throw httpError(400, 'Valid member IDs are required');
    if (!(await User.exists({ _id: member, role: 'student' }))) throw httpError(404, 'Student member not found');
    memberIds.push(member);
  }

  const team = await Team.create({ name: name.trim(), mascot: typeof mascot === 'string' ? mascot : '', members: memberIds });
  for (const memberId of memberIds) {
    await User.updateOne({ _id: memberId }, { $set: { team: team._id } });
  }
  return team.toObject();
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map((item) => item._id) } }).lean();
  const nameById = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals
    .map((item) => ({
      teamName: nameById.get(item._id.toString()) ?? 'Unknown team',
      totalPoints: item.totalPoints,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints || a.teamName.localeCompare(b.teamName))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: userEmail, role: 'student' }).lean();
  if (!user) throw httpError(404, 'Student not found');

  const recent = await Activity.find({ user: user._id }).sort({ occurredAt: -1 }).limit(1).lean();
  const focus = recent[0]?.type === 'strength' ? 'strength'
    : recent[0]?.type === 'run' || recent[0]?.type === 'cycle' ? 'endurance'
    : typeof user.fitnessGoal === 'string' ? user.fitnessGoal : 'mobility';

  const match = await Workout.findOne({ focus }).lean();
  if (match) {
    const reason = recent[0]
      ? `Matches your ${recent[0].type} activity and ${focus} goal`
      : `Supports your ${focus} fitness goal`;
    return [{ ...match, reason }];
  }
  const fallback = await Workout.find().sort({ title: 1 }).lean();
  return fallback.map((workout) => ({
    ...workout,
    reason: `A general workout to support your ${typeof user.fitnessGoal === 'string' ? user.fitnessGoal : 'fitness'} goal`,
  }));
}

export { User };
