/*
 * 京东多账号 Cookie 获取 - Quantumult X 修复版
 * 仅提取 pt_key + pt_pin
 */

const CacheKey = "CookiesJD";

if (!$request) {
  $done({});
} else {
  getCookie();
}

function getCookie() {
  try {
    const headers = $request.headers || {};

    // QX 有时是 Cookie，有时是 cookie
    let cookie =
      headers["Cookie"] ||
      headers["cookie"] ||
      headers["COOKIE"] ||
      "";

    if (!cookie) {
      notify(
        "京东 Cookie 获取失败",
        "",
        "当前请求没有 Cookie 请求头，请重新打开京东个人中心"
      );
      $done({});
      return;
    }

    console.log("[JD] 当前请求: " + $request.url);
    console.log("[JD] Cookie长度: " + cookie.length);

    // 提取 pt_key
    const keyMatch = cookie.match(/(?:^|;\s*)pt_key=([^;]*)/i);

    // 提取 pt_pin
    const pinMatch = cookie.match(/(?:^|;\s*)pt_pin=([^;]*)/i);

    if (!keyMatch || !pinMatch) {
      notify(
        "京东 Cookie 获取失败",
        "",
        "当前请求没有同时发现 pt_key 和 pt_pin"
      );

      console.log("[JD] 未找到完整 Cookie");
      console.log("[JD] Cookie: " + cookie);

      $done({});
      return;
    }

    const pt_key = keyMatch[1];
    const pt_pin = pinMatch[1];

    if (!pt_key || !pt_pin) {
      notify(
        "京东 Cookie 获取失败",
        "",
        "pt_key 或 pt_pin 为空"
      );

      $done({});
      return;
    }

    // Cookie 中只保存京东任务真正需要的两个字段
    const cookieValue =
      "pt_key=" + pt_key + ";pt_pin=" + pt_pin + ";";

    let userName = pt_pin;

    try {
      userName = decodeURIComponent(pt_pin);
    } catch (e) {}

    // 读取历史账号
    let data = getData();

    // 防止历史数据异常
    if (!Array.isArray(data)) {
      data = [];
    }

    // 查找同一个 pt_pin
    let index = -1;

    for (let i = 0; i < data.length; i++) {
      if (!data[i] || !data[i].cookie) continue;

      const oldPinMatch =
        String(data[i].cookie).match(/(?:^|;\s*)pt_pin=([^;]*)/i);

      if (oldPinMatch && oldPinMatch[1] === pt_pin) {
        index = i;
        break;
      }
    }

    if (index >= 0) {
      // 更新已有账号
      data[index].cookie = cookieValue;
      data[index].userName = userName;

      saveData(data);

      notify(
        "京东 Cookie 获取成功 🎉",
        "更新账号" + (index + 1),
        "用户名：" + userName
      );

      console.log("[JD] 更新账号: " + (index + 1));
    } else {
      // 新账号
      data.push({
        userName: userName,
        cookie: cookieValue
      });

      saveData(data);

      notify(
        "京东 Cookie 获取成功 🎉",
        "新增账号" + data.length,
        "用户名：" + userName
      );

      console.log("[JD] 新增账号: " + data.length);
    }

  } catch (e) {

    console.log("[JD] ERROR:");
    console.log(String(e));

    notify(
      "京东 Cookie 获取失败 ⚠️",
      "",
      "脚本运行异常：" + String(e)
    );
  }

  $done({});
}


/* =========================
 * 读取 Cookie 数据
 * ========================= */

function getData() {
  try {
    let value = $prefs.valueForKey(CacheKey);

    if (!value) {
      return [];
    }

    const data = JSON.parse(value);

    return Array.isArray(data) ? data : [];

  } catch (e) {

    console.log("[JD] 读取历史 Cookie 失败: " + String(e));

    return [];
  }
}


/* =========================
 * 保存 Cookie 数据
 * ========================= */

function saveData(data) {

  const value = JSON.stringify(data, null, 2);

  $prefs.setValueForKey(value, CacheKey);

  console.log("[JD] Cookie 已保存");
  console.log(value);
}


/* =========================
 * QX 通知
 * ========================= */

function notify(title, subtitle, message) {

  $notify(
    title,
    subtitle || "",
    message || ""
  );
}
