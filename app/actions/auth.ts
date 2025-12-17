'use server';
 
import { signIn } from '@/auth';
import { AuthError } from 'next-auth';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const RegisterSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  inviteCode: z.string().optional(),
});

export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return '邮箱或密码错误';
        default:
          return '发生了一些错误';
      }
    }
    throw error;
  }
}

export async function register(
  prevState: string | undefined,
  formData: FormData,
) {
  const data = Object.fromEntries(formData.entries());
  
  const validatedFields = RegisterSchema.safeParse(data);

  if (!validatedFields.success) {
    return '字段无效，注册失败';
  }

  const { name, email, password, inviteCode } = validatedFields.data;

  try {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return '该邮箱已被注册';
    }

    let familyId: string | undefined;

    if (inviteCode) {
      // @ts-ignore
      const family = await prisma.family.findUnique({
        where: { id: inviteCode },
      });
      if (family) {
        familyId = family.id;
      } else {
        return '无效的邀请链接或邀请码';
      }
    }

    if (!familyId) {
      // @ts-ignore
      const newFamily = await prisma.family.create({
        data: {
          name: `${name}的家庭`,
        },
      });
      familyId = newFamily.id;
    }

    // const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        password: password, // Store plain text password
        // @ts-ignore
        familyId,
        role: inviteCode ? 'USER' : 'ADMIN', // If creating a family, become ADMIN
      },
    });

  } catch (error) {
    console.error('Registration error:', error);
    return '创建用户失败';
  }

  // Attempt to sign in after registration
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      redirectTo: '/',
    });
  } catch (error) {
    if (error instanceof AuthError) {
        switch (error.type) {
          case 'CredentialsSignin':
            return '邮箱或密码错误';
          default:
            return '发生了一些错误';
        }
      }
      throw error;
  }
}
