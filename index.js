export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // アップロード処理
    if (url.pathname === "/upload" && request.method === "POST") {
      if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
      const formData = await request.formData();
      const file = formData.get("file");
      await env.R2_BUCKET.put(file.name, file.stream());
      return new Response("Uploaded successfully", { status: 200 });
    }

    // ファイル一覧取得
    if (url.pathname === "/list" && request.method === "GET") {
      if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
      const list = await env.R2_BUCKET.list();
      const files = list.objects.map(obj => obj.key);
      return new Response(JSON.stringify(files), {
        headers: { "Content-Type": "application/json" }
      });
    }

    // ファイルダウンロード
    if (url.pathname.startsWith("/download/") && request.method === "GET") {
      if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
      const key = url.pathname.replace("/download/", "");
      const object = await env.R2_BUCKET.get(key);
      if (!object) return new Response("File not found", { status: 404 });
      return new Response(object.body, {
        headers: {
          "Content-Type": "application/octet-stream",
          "Content-Disposition": `attachment; filename="${key}"`
        }
      });
    }

    // ファイル削除
    if (url.pathname.startsWith("/delete/") && request.method === "DELETE") {
      if (!checkAuth(request)) return new Response("Unauthorized", { status: 401 });
      const key = url.pathname.replace("/delete/", "");
      await env.R2_BUCKET.delete(key);
      return new Response("Deleted", { status: 200 });
    }

    return new Response("Not found", { status: 404 });
  }
};

const BASIC_AUTH_PASSWORD = "mypassword";

function checkAuth(request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  return token === BASIC_AUTH_PASSWORD;
}
