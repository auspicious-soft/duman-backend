import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { configDotenv } from 'dotenv';
import { Readable } from 'stream';
configDotenv()

const { AWS_ACCESS_KEY_ID, AWS_REGION, AWS_SECRET_ACCESS_KEY, AWS_BUCKET_NAME } = process.env;

export const createS3Client = () => {
    return new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID as string,
            secretAccessKey: AWS_SECRET_ACCESS_KEY as string
        },
    });
}

export const generateSignedUrlToUploadOn = async (fileName: string, fileType: string, userEmail: string) => {
    const uploadParams = {
        Bucket: AWS_BUCKET_NAME,
        Key: `projects/${userEmail}/my-projects/${fileName}`,
        ContentType: fileType,
    }
    try {
        const command = new PutObjectCommand(uploadParams);
        const signedUrl = await getSignedUrl(createS3Client(), command);
        return signedUrl;
    } catch (error) {
        console.error("Error generating signed URL:", error);
        throw error;
    }
}

export const deleteFileFromS3 = async (imageKey: string) => {
    const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: imageKey,
    }
    try {
        const s3Client = await createS3Client()
        const command = new DeleteObjectCommand(params)
        const response = await s3Client.send(command)
        return response
    } catch (error) {
        console.error('Error deleting file from S3:', error)
        throw error
    }
}
export const uploadStreamToS3Service = async (
  fileStream: Readable,
  fileName: string,
  fileType: string,
  userEmail: string
): Promise<string> => {
  const timestamp = Date.now();
  const imageKey = `users/${userEmail}/images/${timestamp}-${fileName}`;

  // Convert stream to buffer
  const chunks: any[] = [];
  for await (const chunk of fileStream) {
    chunks.push(chunk);
  }
  const fileBuffer = Buffer.concat(chunks);

  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: imageKey,
    Body: fileBuffer,
    ContentType: fileType,
  };

  const s3Client = createS3Client();
  const command = new PutObjectCommand(params);
  await s3Client.send(command);

  return imageKey;
};
