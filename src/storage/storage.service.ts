import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Env } from "src/env";
import axios from "axios";

export interface UploadURLProps {
  uploadURL: string;
  downloadURL?: string;
  bucketAuthorizationToken: string;
}

export interface UploadFileProps extends UploadURLProps {
  file: Express.Multer.File;
}

@Injectable()
export class StorageService {
  constructor(private configService: ConfigService<Env, true>) {}

  async generateUploadURL({
    type,
  }: {
    type: "expense" | "miscelaneous";
  }): Promise<UploadURLProps> {
    const storageAuthorizationToken = this.configService.get(
      "STORAGE_AUTHORIZATION_TOKEN",
    );
    const baseURL = this.configService.get("STORAGE_BASE_URL");
    const expensesBucketId =
      type === "expense"
        ? this.configService.get("EXPENSES_BUCKET_ID")
        : this.configService.get("MISCELANEOUS_BUCKET_ID");

    const response = await axios.get(
      `${baseURL}/b2api/v3/b2_authorize_account`,
      {
        headers: {
          Authorization: `Basic ${storageAuthorizationToken}`,
        },
      },
    );

    const authorizationToken = response.data.authorizationToken;
    const apiURL = response.data.apiInfo.storageApi.apiUrl;
    const downloadURL = response.data.apiInfo.storageApi.downloadUrl;

    const bucketResponse = await axios.get(
      `${apiURL}/b2api/v3/b2_get_upload_url`,
      {
        headers: {
          Authorization: `${authorizationToken}`,
        },
        params: {
          bucketId: expensesBucketId,
        },
      },
    );

    const uploadURL = bucketResponse.data.uploadUrl;
    const bucketAuthorizationToken = bucketResponse.data.authorizationToken;

    return {
      uploadURL,
      downloadURL,
      bucketAuthorizationToken,
    };
  }

  async uploadFile({
    bucketAuthorizationToken,
    uploadURL,
    file,
  }: UploadFileProps): Promise<{
    fileId: string;
    status: number;
  }> {
    const fileName = `${file.originalname.replace(/ /g, "%20")}`;

    const response = await axios.post(`${uploadURL}`, file.buffer, {
      headers: {
        Authorization: `${bucketAuthorizationToken}`,
        "X-Bz-File-Name": fileName,
        "Content-Type": "b2/x-auto",
        "Content-Length": file.size,
        "X-Bz-Content-Sha1": "do_not_verify",
      },
    });

    const ret: {
      fileId: string;
      status: number;
    } = {
      fileId: response.data.fileId,
      status: response.status,
    };

    return ret;
  }
}
