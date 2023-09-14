import { captureMessage } from '@sentry/node';
import S3 from 'aws-sdk/clients/s3';
import { createHash } from 'crypto';
import fs from 'fs';
import { GraphQLUpload } from 'graphql-upload';
import { extendType, objectType, scalarType, stringArg } from 'nexus';
import fetch from 'node-fetch';
import { PassThrough, Readable } from 'stream';
import tmp from 'tmp';

import { loggedInUser } from '../auth/permissions';
import { invalidValueError, unauthenticatedError } from './KenchiError';

export const Upload = scalarType({
  // Why we need the bang: https://github.com/apollographql/apollo-server/blob/570f548b88750a06fbf5f67a4abe78fb0f870ccd/packages/apollo-server-core/src/index.ts#L49-L56
  ...GraphQLUpload!,
  sourceType: 'backingTypes.Upload',
});

// TODO: move to a config somewhere
const BUCKET_BY_APP_ENV: Record<string, string> = {
  production: 'kenchi-files',
  staging: 'kenchi-staging-files',
  development: 'kenchi-dev-files',
};

export const uploadFile = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('uploadFile', {
      args: {
        file: 'Upload',
        url: stringArg(),
      },
      type: objectType({
        name: 'UploadFile',
        definition(t) {
          t.nullable.string('url');
          t.nullable.field('error', { type: 'KenchiError' });
        },
      }),
      async resolve(_root, { file, url: sourceUrl }, ctx) {
        const startTime = Date.now();

        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        let createReadStream: () => fs.ReadStream;
        let filename: string;
        let ContentType: string | undefined;
        if (file) {
          const fileDetails = await file;
          createReadStream = fileDetails.createReadStream;
          filename = fileDetails.filename;
          ContentType = fileDetails.mimetype;
        } else if (sourceUrl) {
          // TODO: slightly worried about being an arbitrary file proxy.
          // Probably want to rate limit or alert or something.
          const parsedUrl = new URL(sourceUrl);

          const tmpFile = tmp.fileSync().name;
          const res = await fetch(sourceUrl);
          const body = res.body;
          if (!body) {
            throw new Error('No body');
          }
          await new Promise((resolve, reject) => {
            const writeStream = fs.createWriteStream(tmpFile);
            body.pipe(writeStream);
            body.on('error', reject);
            writeStream.on('finish', resolve);
          });
          createReadStream = () => fs.createReadStream(tmpFile);

          if (res.status !== 200) {
            captureMessage(`Upload attempt failed from ${parsedUrl.host}`, {
              extra: { sourceUrl },
            });
            return {
              error: invalidValueError('error fetching URL'),
            };
          }

          ContentType = res.headers.get('content-type') || undefined;
          filename =
            parsedUrl.pathname?.split('/').pop() ||
            `image.${ContentType?.split('/')[1] || 'png'}`;
        } else {
          return {
            error: invalidValueError('missing file or url'),
          };
        }

        const s3 = new S3({ region: 'us-west-1' });
        const bucketName = BUCKET_BY_APP_ENV[process.env.APP_ENV!];
        const hash = await md5FromStream(createReadStream());
        const key = `${user.organizationId}/${hash}/${filename}`;

        const pass = new PassThrough();
        const uploadPromise = s3
          .upload({
            Bucket: bucketName,
            Key: key,
            Body: pass,
            ContentType,
            ACL: 'public-read',
          })
          .promise();
        createReadStream().pipe(pass);
        // TODO: catch AWSError?
        const upload = await uploadPromise;
        const url = upload.Location;

        console.log(
          `[${Date.now() - startTime}ms] User ${user.id} uploaded file ${url}`
        );

        return { url };
      },
    });
  },
});

function md5FromStream(stream: Readable): Promise<string> {
  return new Promise((resolve) => {
    const hash = createHash('md5');
    hash.setEncoding('base64');
    stream.on('end', () => {
      hash.end();
      resolve(hash.read());
    });
    stream.pipe(hash);
  });
}
