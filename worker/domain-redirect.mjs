export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.hostname === "machierabi-annai.kake-web.workers.dev") {
      url.hostname = "machierabi.3f7735.org";
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
