import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard as PassportAuthGuard } from '@nestjs/passport';

import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { Public } from './public.decorator';
import { ThrottleAuth } from 'src/common/throttle.decorators';

@ThrottleAuth()
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // Google OAuth routes
  @Public()
  @Get('google')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuth() {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(PassportAuthGuard('google'))
  async googleAuthRedirect(@Request() req, @Res() res) {
    const token = await this.authService.googleLogin(req.user);
    
    // Set cookie
    res.cookie('token', token.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to frontend with success
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    return res.redirect(`${frontendUrl}/home?auth=success`);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async signOut(@Res() res) {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
    return res.send({ message: 'Logout successful' });
  }

  @UseGuards(AuthGuard)
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}
