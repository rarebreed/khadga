import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from "@nestjs/config";

let dotFile = ".env";
if (process.env["NODE_ENV"] && process.env["NODE_ENV"] === "dev") {
  dotFile = ".dev.env";
}

@Module({
  imports: [ConfigModule.forRoot({
    envFilePath: dotFile
  })],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
