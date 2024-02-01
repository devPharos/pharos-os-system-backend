import {
  Controller,
  Param,
  Post,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from "@nestjs/common";

import { StorageService } from "./storage.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { Response } from "express";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";

@Controller("storage")
@UseGuards(JwtAuthGuard)
export class StorageController {
  constructor(private readonly storageService: StorageService) {}

  @Post("upload/file")
  @UseInterceptors(FileInterceptor("file"))
  async generateUploadURL(
    @Res() res: Response,
    @UploadedFile() file: Express.Multer.File,
    @Param() params: { type: "expense" | "miscelaneous" },
  ): Promise<Response<any, Record<string, any>>> {
    const { type } = params;
    const fileData = await this.storageService.generateUploadURL({ type });

    const upload = await this.storageService.uploadFile({
      bucketAuthorizationToken: fileData.bucketAuthorizationToken,
      file,
      uploadURL: fileData.uploadURL,
    });

    return res.json({
      ...upload,
      downloadUrl: fileData.downloadURL,
    });
  }
}
