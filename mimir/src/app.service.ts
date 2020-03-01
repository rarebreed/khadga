import { Injectable, Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from "@nestjs/config";
import { OAuth2Client } from "google-auth-library";

import * as fs from "fs";

interface OAuth2ClientSpec {
  web: {
    client_id: string,
    project: string,
    auth_uri: string,
    token_uri: string,
    auth_provider_x509_cert_url: string,
    client_secret?: string,
    javascript_origins: string[]
  }
}

@Module({
  imports: [ConfigModule]
})

@Injectable()
export class AppService {
  dotEnv: string;
  client: OAuth2Client;
  oauthSpec: OAuth2ClientSpec;

  constructor(private readonly configSvc: ConfigService) {
    this.dotEnv = this.configSvc.get<string>("KHADGA_OAUTH");

    /* let oauthJson = JSON.parse(fs.readFileSync(this.dotEnv).toString()) as OAuth2ClientSpec; */
    this.oauthSpec = require(this.dotEnv);

    Logger.log(`this.oauthSpec: ${JSON.stringify(this.oauthSpec)}`);
    this.client = new OAuth2Client(this.oauthSpec.web.client_id);
  }

  async verifyAuth(token: string) {
    let { client_id } = this.oauthSpec.web;

    const ticket = await this.client.verifyIdToken({
      idToken: token,
      audience: client_id,  // Specify the CLIENT_ID of the app that accesses the backend
    });

    const payload = ticket.getPayload();
    console.log("payload is", payload);
    const userid = payload['sub'];
    return userid;
  }
}
