import Document, {
  Head,
  Html,
  Main,
  NextScript,
  type DocumentContext,
  type DocumentInitialProps,
} from "next/document";

/**
 * Minimal custom Document.
 *
 * Next.js App Router projects normally don't need `pages/_document`, but some
 * build/export flows (and certain Next.js versions) may still attempt to resolve
 * `/_document` internally. Providing this file prevents "Cannot find module for
 * page: /_document" during static export in CI.
 */
export default class MyDocument extends Document {
  // PUBLIC_INTERFACE
  static async getInitialProps(
    ctx: DocumentContext
  ): Promise<DocumentInitialProps> {
    /** Standard Next.js Document initial props collection. */
    const initialProps = await Document.getInitialProps(ctx);
    return initialProps;
  }

  render() {
    return (
      <Html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
