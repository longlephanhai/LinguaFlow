import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './schemas/user.schema.js';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async create(createUserData: Partial<User>): Promise<User> {
    const newUser = new this.userModel({
      ...createUserData,
      settings: {
        dailyReviewGoal: 20,
        quizDefaultCount: 10,
        timezone: 'UTC', // Default, should be overwritten by client
      }
    });
    return newUser.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email, isDeleted: false }).exec();
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findOne({ _id: id, isDeleted: false }).exec();
  }

  async update(id: string, updateData: Partial<User>): Promise<User> {
    const updatedUser = await this.userModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: updateData },
      { new: true }
    ).exec();
    
    if (!updatedUser) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return updatedUser;
  }
}
