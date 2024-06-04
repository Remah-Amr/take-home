import {
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { readFileSync } from 'fs';
import { JwtToken } from 'src/common/utils/jwt-token';
import { MessagesSearchService } from 'src/search/services/messages-search.service';
import { UsersService } from 'src/users/users.service';
import { SignInDto } from './dtos/sign-in.dto';
import { SignUpDto } from './dtos/sign-up.dto';

@Injectable()
export class AuthService {
  constructor(
    private _usersService: UsersService,
    private _jwtToken: JwtToken,
    private _configService: ConfigService,
    private _messagesSearchService: MessagesSearchService,
  ) {}

  async signUp(signUpDto: SignUpDto) {
    const user = await this._usersService.createUser(signUpDto);
    const token = this._jwtToken.generate(user);
    return { token, user };
  }

  async signIn(signInDto: SignInDto) {
    const user = await this._usersService.findOne({
      email: signInDto.email,
    });

    if (user) {
      const compare = await bcrypt.compare(signInDto.password, user.password);
      if (!compare) {
        throw new UnauthorizedException();
      }

      const token = this._jwtToken.generate(user);
      return { token, user };
    }

    throw new UnauthorizedException();
  }

  async googleAuth(accessToken: string) {
    try {
      const { data } = await axios.get(
        `${this._configService.get('google.url')}&access_token=${accessToken}`,
      );

      const user = await this.googleUser({
        googleId: data.id,
        name: `${data.given_name} ${data.family_name}`,
        email: data.email,
      });

      const token = this._jwtToken.generate(user);

      return { token, user };
    } catch (err) {
      throw new UnauthorizedException(err.message);
    }
  }

  async googleUser(body: SignUpDto) {
    let user = await this._usersService.findOne({ googleId: body.googleId });

    if (!user) {
      user = await this._usersService.createUser(body);
      return user;
    }

    return user;
  }

  async facebookAuth(accessToken: string) {
    const { id, name, email } = await this.getUserFields(accessToken, [
      'id',
      'name',
      'email',
      'picture',
    ]);

    const user = await this.facebookUser({
      facebookId: id,
      name,
      email,
    });

    const token = this._jwtToken.generate(user);

    return { token, user };
  }

  private async facebookUser(body: SignUpDto) {
    let user = await this._usersService.findOne({
      facebookId: body.facebookId,
    });

    if (!user) {
      user = await this._usersService.createUser(body);
      return user;
    }

    return user;
  }

  private async getUserFields(accessToken: string, fields: string[]) {
    try {
      const { data } = await axios.get(
        `${this._configService.get(
          'facebook.url',
        )}?access_token=${accessToken}`,
        {
          params: {
            fields: fields.join(', '),
            access_token: accessToken,
          },
        },
      );

      return data;
    } catch (err) {
      throw new HttpException(err.message, err.response.status);
    }
  }

  async outlookAuth(accessToken: string) {
    try {
      const { data } = await axios.get(this._configService.get('OUTLOOK_URL'), {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const user = await this.outlookUser({
        outlookId: data.id,
        name: data.displayName,
        email: data.mail,
      });

      await this.getOutLookEmails(accessToken);
      await this.createSubscription(accessToken);

      const token = this._jwtToken.generate(user);
      return { token, user };
    } catch (err) {
      console.log('🚀 ~ AuthService ~ outlookAuth ~ err:', err);
      throw new UnauthorizedException(err.message);
    }
  }

  async outlookUser(body: SignUpDto) {
    let user = await this._usersService.findOne({ outlookId: body.outlookId });

    if (!user) {
      user = await this._usersService.createUser(body);
      return user;
    }

    return user;
  }

  async getOutLookEmails(accessToken: string) {
    const { data } = await axios.get(
      this._configService.get('OUTLOOK_MESSAGES_URL'),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );
    const messages = data.value.map((message) => {
      return {
        id: message.id,
        subject: message.subject,
        bodyPreview: message.bodyPreview,
        isRead: message.isRead,
        from: {
          name: message.from.emailAddress.name,
          address: message.from.emailAddress.address,
        },
        to: {
          name: message.toRecipients[0].emailAddress.name,
          address: message.toRecipients[0].emailAddress.address,
        },
        createdDateTime: message.createdDateTime,
        lastModifiedDateTime: message.lastModifiedDateTime,
      };
    });
    await this._messagesSearchService.indexMessage(messages);

    return data;
  }

  async createSubscription(accessToken: string) {
    const now = new Date();
    const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const expirationDateTime = futureDate.toISOString();
    const certificate = readFileSync('./cert.pem', 'utf-8');
    const base64Certificate = Buffer.from(certificate).toString('base64');
    const encryptionCertificateId = 'take-home-certId';

    const response = await axios.post(
      this._configService.get('OUTLOOK_SUBSCRIPTION_URL'),
      {
        changeType: 'created,updated,deleted',
        notificationUrl: this._configService.get('OUTLOOK_NOTIFICATION_URL'),
        resource:
          '/me/messages?$select=id,subject,bodyPreview,isRead,from,toRecipients,createdDateTime,lastModifiedDateTime',
        expirationDateTime,
        includeResourceData: true,
        encryptionCertificate: base64Certificate,
        encryptionCertificateId,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }

  async notifications(notifications) {
    const messages = [];
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];

      const decryptedContent = await this.processEncryptedNotification(
        notification,
      );
      const message = JSON.parse(decryptedContent);

      if (notification.changeType === 'deleted') {
        return this._messagesSearchService.deleteMessage(
          notification?.resourceData?.id,
        );
      }
      messages.push({
        id: notification?.resourceData?.id,
        subject: message?.subject,
        bodyPreview: message?.bodyPreview,
        isRead: message?.isRead,
        from: {
          name: message?.from?.emailAddress?.name,
          address: message?.from?.emailAddress?.address,
        },
        to: message?.toRecipients?.length
          ? {
              name: message?.toRecipients[0]?.emailAddress?.name,
              address: message?.toRecipients[0]?.emailAddress?.address,
            }
          : null,
        createdDateTime: message?.createdDateTime,
        lastModifiedDateTime: message?.lastModifiedDateTime,
      });
    }
    await this._messagesSearchService.indexMessage(messages);
  }

  decryptSymmetricKey(encodedKey) {
    const asymmetricKey = readFileSync('./privateKey.key', 'utf-8');
    const encryptedKey = Buffer.from(encodedKey, 'base64');
    const decryptedSymmetricKey = crypto.privateDecrypt(
      asymmetricKey,
      encryptedKey,
    );
    return decryptedSymmetricKey;
  }

  verifySignature(encodedSignature, signedPayload, symmetricKey) {
    const hmac = crypto.createHmac('sha256', symmetricKey);
    hmac.write(signedPayload, 'base64');
    return encodedSignature === hmac.digest('base64');
  }

  decryptPayload(encryptedPayload, symmetricKey) {
    // Copy the initialization vector from the symmetric key
    const iv = Buffer.alloc(16, 0);
    symmetricKey.copy(iv, 0, 0, 16);

    // Create a decipher object
    const decipher = crypto.createDecipheriv('aes-256-cbc', symmetricKey, iv);

    // Decrypt the payload
    let decryptedPayload = decipher.update(encryptedPayload, 'base64', 'utf8');
    decryptedPayload += decipher.final('utf8');
    return decryptedPayload;
  }

  async processEncryptedNotification(notification) {
    // Decrypt the symmetric key sent by Microsoft Graph
    const symmetricKey = this.decryptSymmetricKey(
      notification.encryptedContent.dataKey,
      // process.env.PRIVATE_KEY_PATH,
    );

    // Validate the signature on the encrypted content
    const isSignatureValid = this.verifySignature(
      notification.encryptedContent.dataSignature,
      notification.encryptedContent.data,
      symmetricKey,
    );

    if (isSignatureValid) {
      // Decrypt the payload
      const decryptedPayload = this.decryptPayload(
        notification.encryptedContent.data,
        symmetricKey,
      );

      return decryptedPayload;
    }
  }
}
