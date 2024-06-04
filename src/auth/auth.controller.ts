import { Body, Controller, HttpCode, Post, Req, Res } from '@nestjs/common';
import { Public } from 'src/common/decorators/is-public.decorator';
import { AuthService } from './auth.service';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';

@Controller('auth')
@Public()
export class AuthController {
  constructor(private _authService: AuthService) {}

  @Post('/signup')
  async signup(@Body() signUpDto: SignUpDto) {
    return this._authService.signUp(signUpDto);
  }

  @Post('/signin')
  async signin(@Body() signInDto: SignInDto) {
    return this._authService.signIn(signInDto);
  }

  @Post('/google/login')
  async googleAuth(@Body('accessToken') accessToken: string) {
    return this._authService.googleAuth(accessToken);
  }

  @Post('/facebook/login')
  async facebookLogin(@Body('accessToken') accessToken: string) {
    return this._authService.facebookAuth(accessToken);
  }

  @Post('/outlook/login')
  async outlookLogin(@Body('accessToken') accessToken: string) {
    return this._authService.outlookAuth(accessToken);
  }

  @Post('/outlook/emails')
  async outlookEmails(@Body('accessToken') accessToken: string) {
    return this._authService.getOutLookEmails(accessToken);
  }

  @Post('/outlook/notification')
  @HttpCode(202)
  async notifications(@Req() req, @Res() res) {
    const validationToken = req.query.validationToken as string;
    console.log(' ~ validationToken:', validationToken);
    console.log('🚀 ~ AuthController ~ notifications ~ req.body:', req.body);

    if (validationToken) {
      // Respond to the validation req
      res.status(200).send(validationToken);
    } else {
      await this._authService.notifications(req.body.value);
      res.status(202).send();
    }
  }
}
