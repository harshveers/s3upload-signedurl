import { Component, OnInit } from '@angular/core';
import { Uppy } from '@uppy/core'
import AwsS3 from '@uppy/aws-s3'
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const REGION = "ap-southeast-1";
const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: '',
    secretAccessKey: '',
    sessionToken: ''
  }
});

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: [
    './app.component.scss',
  ]
})
export class AppComponent implements OnInit {
  uppy: Uppy = new Uppy({
    debug: true,
    autoProceed: true
  });

  ngOnInit() {
    this.uppy.use(AwsS3, {
      limit: 4,
      getUploadParameters: this.getFileUploadConfig
    });

    this.uppy.on('upload-success', (file, data) => {
      console.log(file);
      console.log(data);
    });
  }

  async getFileUploadConfig(file: any): Promise<any> {
    const fileUploadParams = {
      Bucket: 's3upload-poc',
      Key: file.name,
      ResponseContentType: file.type,
      // Specify metadata here in config for pre-signed URL
      Metadata: {
        'username': 'harshveers-' + file.name,
        'fullname': 'Harshveer Singh - ' + file.name,
      },
      Tagging: "random=random"
    };

    const command = new PutObjectCommand(fileUploadParams);
    // Create the presigned URL.
    const signedUrl = await getSignedUrl(s3Client, command, {
      expiresIn: 3600,
    });

    return {
      method: 'PUT',
      url: signedUrl,
      fields: {},
      headers: {
        'Content-Type': file.type,
        // This header needs to be allowed in CORS config of S3 bucket.
        // Bucket permission needs to be ginved to allow tagging
        //'x-amz-tagging': 'username=harshveers&fullname=HarshveerSingh'
      }
    }
  }
}
