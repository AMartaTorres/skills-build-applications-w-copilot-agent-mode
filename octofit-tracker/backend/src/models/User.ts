import { Schema, model } from 'mongoose';

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  team: { type: Schema.Types.ObjectId, ref: 'Team' },
  fitnessGoal: { type: String, required: true },
  role: { type: String, enum: ['student', 'teacher'], default: 'student', required: true },
});

export const User = model('User', userSchema);
