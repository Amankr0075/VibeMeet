import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import User from '../models/User';

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const { username, gender, preferredGender, profileImage, bio, isCollegeStudent, institutionName, preferredCommunity } = req.body;

    const $set: any = {};
    const $unset: any = {};

    if (username !== undefined) {
      if (username.trim() === '') {
        $unset.username = 1;
      } else {
        $set.username = username.trim();
      }
    }
    if (gender !== undefined) $set.gender = gender;
    if (preferredGender !== undefined) $set.preferredGender = preferredGender;
    if (profileImage !== undefined) $set.profileImage = profileImage;
    if (bio !== undefined) $set.bio = bio;
    if (isCollegeStudent !== undefined) $set.isCollegeStudent = Boolean(isCollegeStudent);
    if (institutionName !== undefined) $set.institutionName = String(institutionName).trim();

    if (preferredCommunity !== undefined && !['EVERYONE', 'COLLEGE_STUDENTS'].includes(preferredCommunity)) {
      res.status(400).json({ error: 'Invalid matching community preference.' });
      return;
    }
    if (preferredCommunity !== undefined) $set.preferredCommunity = preferredCommunity;

    const currentUser = await User.findById(userId);
    const willBeCollegeStudent = $set.isCollegeStudent ?? currentUser?.isCollegeStudent;
    const willUseCollegeMatching = $set.preferredCommunity ?? currentUser?.preferredCommunity;
    const willHaveInstitution = $set.institutionName ?? currentUser?.institutionName;

    if (willBeCollegeStudent && !willHaveInstitution) {
      res.status(400).json({ error: 'Please enter your college or university name.' });
      return;
    }
    if (willUseCollegeMatching === 'COLLEGE_STUDENTS' && (!willBeCollegeStudent || !willHaveInstitution)) {
      res.status(400).json({ error: 'Add your college or university name before choosing same-college matching.' });
      return;
    }
    if ($set.isCollegeStudent === false) {
      $unset.institutionName = 1;
      delete $set.institutionName;
      if (willUseCollegeMatching === 'COLLEGE_STUDENTS') $set.preferredCommunity = 'EVERYONE';
    }

    if ($set.username) {
      // Check if username is taken by another user (case-insensitive)
      const existingUser = await User.findOne({
        username: { $regex: new RegExp(`^${$set.username}$`, 'i') },
        _id: { $ne: userId }
      });
      if (existingUser) {
        res.status(409).json({ error: 'Username is already taken' });
        return;
      }
    }

    const updatePayload: any = {};
    if (Object.keys($set).length > 0) updatePayload.$set = $set;
    if (Object.keys($unset).length > 0) updatePayload.$unset = $unset;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        _id: updatedUser._id,
        name: updatedUser.name,
        username: updatedUser.username,
        email: updatedUser.email,
        profileImage: updatedUser.profileImage,
        bio: updatedUser.bio,
        gender: updatedUser.gender,
        preferredGender: updatedUser.preferredGender,
        isCollegeStudent: updatedUser.isCollegeStudent,
        institutionName: updatedUser.institutionName,
        preferredCommunity: updatedUser.preferredCommunity,
        role: updatedUser.role,
        accountStatus: updatedUser.accountStatus,
      }
    });

  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        bio: user.bio,
        gender: user.gender,
        preferredGender: user.preferredGender,
        isCollegeStudent: user.isCollegeStudent,
        institutionName: user.institutionName,
        preferredCommunity: user.preferredCommunity,
        role: user.role,
        accountStatus: user.accountStatus,
      }
    });
  } catch (error) {
    console.error('Get Me Error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
