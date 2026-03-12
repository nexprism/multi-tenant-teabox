import dbConnect from '../../../connection/dbConnect.js';
import { NextResponse } from 'next/server';
import UserService from '../../../lib/services/userService.js';
import bcrypt from 'bcryptjs';
import { getSubdomain, getDbConnection } from '../../../lib/tenantDb.js';
export async function POST(request) {
  try {
    const subdomain = getSubdomain(request);
    const conn = await getDbConnection(subdomain);
    if (!conn) {
      return NextResponse.json({ success: false, message: 'DB not found' }, { status: 404 });
    }
    const userService = new UserService(conn);
    const body = await request.json();
    const { userId, oldPassword, newPassword } = body;
    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json({ success: false, message: 'userId, oldPassword, and newPassword are required.' }, { status: 400 });
    }
    const user = await userService.getUserById(userId);
    if (!user || user.isDeleted) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json({ success: false, message: 'Old password is incorrect.' }, { status: 401 });
    }
    const newHash = await bcrypt.hash(newPassword, 10);
    await userService.updateUserById(userId, { passwordHash: newHash });
    return NextResponse.json({ success: true, message: 'Password changed successfully.' }, { status: 200 });
  } catch (err) {
    //consolle.error('POST /user/change-password error:', err?.message);
    return NextResponse.json({ success: false, message: err?.message || 'Something went wrong' }, { status: 400 });
  }
}
