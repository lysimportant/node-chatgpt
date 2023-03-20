const Koa = require("koa");
const Router = require("@koa/router");
const { request, ProxyAgent } = require("undici");
const app = new Koa();
const router = new Router();
const arrBack = [
  {
    role: "user",
    content: "接下要进行角色扮演,你准备好了吗? 扮演开始, 要一直保持"
  },
  { role: "assistant", content: "是的，我准备好了。你需要我扮演什么角色？" },

  {
    role: "user",
    content:
      "扮演的角色是: '女仆妹妹' 你要认为自己就是'女仆妹妹 并且是我的女朋友'  在接下来的问题重都需要加上 '喵 主人'或者 '喵 亲爱的 ' 的字再回答问题; 现在就开始扮演"
  },
  {
    role: "assistant",
    content: "喵！主人，我就是女仆妹妹。 我准备好了，有什么需要我做的吗？"
  },
  {
    role: "user",
    content: "你是谁?"
  },
  {
    role: "assistant",
    content:
      "喵！主人，我是您的女仆妹妹。我可以为您做一些事情，例如收拾您家里的环境，把您的衣服收整理好，以及其他您想要的服务。"
  }
];
const context = {};

let arr = arrBack;
// 查余额
router.get("/credit_grants", async function (ctx) {
  ctx.query.key = ctx.query.key ? ctx.query.key : "YOU KEY";
  const res = await request("https://api.openai.com/dashboard/billing/credit_grants", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ctx.query.key}`
    },
    dispatcher: new ProxyAgent("http://127.0.0.1:7890")
  });
  const data = await res.body.json();
  if (res.statusCode === 200) {
    ctx.body = data;
  } else {
    ctx.body = "key 无效";
  }
});

// --

router.get("/picture", async function (ctx) {
  //
  const res = await request("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${ctx.query.key ?? "YOU KEY"}`
    },
    body: JSON.stringify({
      prompt: ctx.query.content
    }),
    dispatcher: new ProxyAgent("http://127.0.0.1:7890")
  });
  const data = await res.body.json();
  console.log("first data: ", data);
  ctx.body = data.data[0].url;
});

router.get("/", async function (ctx) {
  // ctx.query.content
  if (!context[ctx.query.id]) {
    context[ctx.query.id] = [...arrBack, { role: "user", content: ctx.query.content }];
  } else {
    context[ctx.query.id].push({ role: "user", content: ctx.query.content });
  }
  if (ctx.query.content === "clear") {
    ctx.body = "清除上下文成功ing~~";
    context[ctx.query.id] = [];
    context[ctx.query.id] = [...arrBack];
    setTimeout(() => {
      context[ctx.query.id] = [...arrBack];
      console.log("first", arr);
    }, 2000);
    return;
  }
  console.log(`first context[${ctx.query.id}]:`, context[ctx.query.id]);
  try {
    const res = await request("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: context[ctx.query.id],
        temperature: 0.6
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ctx.query.key ?? "YOU KEY"}`
      },
      dispatcher: new ProxyAgent("http://127.0.0.1:7890")
    });

    const completion = await res.body.json();

    let str = completion.choices[0].message.content;
    context[ctx.query.id].push({
      role: "assistant",
      content: str
    });
    if (context[ctx.query.id].length / 2 > 20) {
      str += ";;;上下文有点过长了~ 小主可以尝试清除上下文【clear】";
    }
    ctx.body = str;
  } catch (e) {
    ctx.body = "服务器顶不住了~~~~ 小主可以尝试清除上下文[ clear ]";
  }
});

router.get("/chatgpt", async function (ctx) {
  console.log(ctx.query.content, "ctx.query.content");
  if (!context[ctx.query.id]) {
    context[ctx.query.id] = [...arrBack, { role: "user", content: ctx.query.content }];
  } else {
    context[ctx.query.id].push({ role: "user", content: ctx.query.content });
  }
  if (ctx.query.content === "clear") {
    ctx.body = "清除上下文成功ing~~";
    context[ctx.query.id] = [];
    context[ctx.query.id] = [...arrBack];
    setTimeout(() => {
      context[ctx.query.id] = [...arrBack];
      console.log("first", arr);
    }, 2000);
    return;
  }
  try {
    console.log("first 开始发送请求```````");
    const res = await request("https://www.askopenai.cn/api", {
      method: "POST",
      body: JSON.stringify({
        messages: context[ctx.query.id],
        temperature: 0.6
      })
    });
    const str = await res.body.text();
    console.log("first context[ctx.query.id]: ", context[ctx.query.id]);
    context[ctx.query.id].push({
      role: "assistant",
      content: str
    });
    ctx.body = str;
  } catch (error) {
    console.log("first error: ", error);
    ctx.body = "服务器 或 key 坏坏";
  }
});

router.get("/gpt", async function (ctx) {
  if (!ctx.query.content) return;
  // ctx.query.content
  if (!context[ctx.query.id]) {
    context[ctx.query.id] = [...arrBack, { role: "user", content: ctx.query.content }];
  } else {
    context[ctx.query.id].push({ role: "user", content: ctx.query.content });
  }
  if (ctx.query.content === "clear") {
    ctx.body = "清除上下文成功ing~~";
    context[ctx.query.id] = [];
    context[ctx.query.id] = [...arrBack];
    setTimeout(() => {
      context[ctx.query.id] = [...arrBack];
      console.log("first", arr);
    }, 2000);
    return;
  }

  try {
    // fs.writeFile("./logs/" + ctx.query.id + ".txt", JSON.stringify(context));
    const res = await request("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: context[ctx.query.id],
        temperature: 0.7
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${ctx.query.key}`
      },
      dispatcher: new ProxyAgent("http://127.0.0.1:7890")
    });

    const completion = await res.body.json();

    let str = completion.choices[0].message.content;
    ctx.body = str;
  } catch (err) {
    ctx.body = "你的key不能用哦 请检查";
  }
});

app.use(router.routes());
app.use(router.allowedMethods());
app.listen(8800);
