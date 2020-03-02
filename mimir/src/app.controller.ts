import { Controller
       , Post
       , Get
       , Body
       , Header 
       } from '@nestjs/common';
import { AppService } from './app.service';

interface GoogleToken {
  token: string
}

@Controller("/auth")
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @Header("Content-Type", "application/json")
  async verifyAuth(@Body() dto: GoogleToken): Promise<string> {
    let userid = await this.appService.verifyAuth(dto.token);

    // TODO: Look up user in the database
    return `UserID is ${userid}`
  }
}


@Controller("/health")
export class HealthController {
  @Get()
  health() {
    return "Healthy"
  }
}