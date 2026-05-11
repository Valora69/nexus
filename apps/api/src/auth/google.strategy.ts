import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private prismaService: PrismaService) {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8080/api/auth/google/callback',
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    
    const email = emails[0].value;
    const firstName = name.givenName;
    const lastName = name.familyName;
    const picture = photos[0]?.value;
    
    try {
      // Find or create user
      let user = await this.prismaService.user.findUnique({
        where: { googleId: id },
      });

      if (!user) {
        // Try to find by email in case user exists from old system
        user = await this.prismaService.user.findUnique({
          where: { email },
        });

        if (user) {
          // Update existing user with Google ID
          user = await this.prismaService.user.update({
            where: { email },
            data: {
              googleId: id,
              picture: picture || user.picture,
              name: user.name || `${firstName} ${lastName}`,
            },
          });
        } else {
          // Create new user
          user = await this.prismaService.user.create({
            data: {
              email,
              name: `${firstName} ${lastName}`,
              googleId: id,
              picture,
            },
          });
        }
      }

      done(null, user);
    } catch (error) {
      done(error, null);
    }
  }
}
