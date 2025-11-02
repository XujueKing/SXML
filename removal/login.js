//注册入口
window.addEventListener('load', function () {
  route(false);
  LoadShowToast();
  //获取本地配置
  getConfig();
  // 异步采集客户端环境（不阻塞UI）
  initClientEnv();
});
//卸载定时器
window.addEventListener("beforeunload", function (event) {
  clearInterval(time);
});

// 全局变量
let keyStatus = false;
let codeStatus = false;
let time = null;

// 采集客户端环境信息
let loginIp = '';
let loginLocation = '';
let loginOs = '';
// 简单的操作系统检测
function detectOS() {
  try {
    const ua = navigator.userAgent || navigator.vendor || window.opera || '';
    if (/windows nt/i.test(ua)) return 'Windows';
    if (/mac os x/i.test(ua)) return 'macOS';
    if (/android/i.test(ua)) return 'Android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
    if (/linux/i.test(ua)) return 'Linux';
    return 'Unknown';
  } catch (e) {
    return 'Unknown';
  }
}
// 初始化客户端环境信息
async function initClientEnv() {
  // 操作系统本地解析即可
  loginOs = detectOS();

  // 优先使用 ipapi.co 一次性获取 IP + 地区
  try {
    const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      loginIp = data.ip || loginIp;
      const parts = [data.city, data.region, data.country_name].filter(Boolean);
      loginLocation = parts.join(', ');
      return;
    }
  } catch (_) { /* 忽略，进入回退 */ }

  // 回退：仅拿公网 IP
  try {
    const res2 = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    if (res2.ok) {
      const data2 = await res2.json();
      loginIp = data2.ip || loginIp;
    }
  } catch (_) { /* 忽略 */ }
}

// 全站全局超级API实例（挂载到window对象）
window.superAPI = null;

//1、限制输入手机号码
// 允许数字、删除、退格、左右箭头、Tab和Enter键
// 并限制长度为11位
// 输入框绑定示例： onkeydown="return onlyNum(event)"
// 2025-11-01
function onlyNum(e) {
  // 确保有事件对象
  const event = e || window.event;

  // 允许的按键代码
  const allowedKeys = {
    'Backspace': 8,
    'Delete': 46,
    'ArrowLeft': 37,
    'ArrowRight': 39,
    'Tab': 9,
    'Enter': 13
  };

  // 如果是功能键，允许输入
  if (allowedKeys[event.key] || event.ctrlKey || event.metaKey) {
    return true;
  }

  // 检查是否是数字键或数字小键盘
  const isNumericInput = (
    /^\d$/.test(event.key) ||                    // 主键盘数字
    (event.keyCode >= 96 && event.keyCode <= 105) // 数字小键盘
  );

  // 防止非数字输入
  if (!isNumericInput) {
    event.preventDefault();
    return false;
  }

  // 检查长度限制（手机号11位）
  const input = event.target;
  if (input.value.length >= 11 && !event.ctrlKey && !event.metaKey) {
    event.preventDefault();
    return false;
  }

  return true;
}
//2、焦点集中效果和账号验证
// 使用自定义事件通知账号变化
// 2025-11-01
function u_onfocus(id, check) {
  // 使用常量存储重复使用的DOM元素引用
  const element = document.getElementById(id);
  const elements = {
    key: document.getElementById('k'),
    lock: document.getElementById('l'),
    lockLabel: document.getElementById('l2'),
    barcode: document.getElementById('b_code'),
    barcode2: document.getElementById('b_code2'),
    barcode3: document.getElementById('b_code3')
  };

  // 清除占位符
  if (element) {
    element.placeholder = '';
  }

  // 如果不需要检查，直接返回
  if (!check) {
    return;
  }

  // 获取用户手机号并验证
  const mobileInput = document.getElementById('u');
  if (!mobileInput) {
    console.warn('Mobile input element not found');
    return;
  }

  const mobile = mobileInput.value;
  // 验证手机号格式
  if (!mobile || mobile.length !== 11 || !/^\d{11}$/.test(mobile)) {
    return;
  }

  // 检查本地存储的账号
  const storedMobile = localStorage.getItem('userAccount');

  try {
    if (mobile !== storedMobile) {
      // 账号不匹配，重置状态
      keyStatus = false;

      // 使用对象方法统一管理显示状态
      const displayStates = {
        key: 'block',
        lock: 'none',
        lockLabel: 'none',
        barcode: 'none',
        barcode2: 'none',
        barcode3: 'none'
      };

      // 批量更新显示状态
      Object.entries(displayStates).forEach(([key, value]) => {
        if (elements[key]) {
          elements[key].style.display = value;
        }
      });

      // 触发自定义事件通知状态变化
      const event = new CustomEvent('accountChange', {
        detail: {
          mobile,
          matched: false
        }
      });
      document.dispatchEvent(event);
    } else {
      // 账号匹配，加载配置
      getConfig();

      // 触发自定义事件
      const event = new CustomEvent('accountChange', {
        detail: {
          mobile,
          matched: true
        }
      });
      document.dispatchEvent(event);
    }
  } catch (error) {
    console.error('Error in account validation:', error);
    ShowToast('There was an error during the account verification process, please try again', 'confirm');
  }
}
//3、焦点离开效果和输入验证
// 2025-11-01
function u_onblur(id) {
  // 使用常量存储占位符文本
  const PLACEHOLDERS = {
    u: 'Please enter mobile phone',
    k: 'digital key（Key）',
    p: 'Please enter the password'
  };

  try {
    // 获取输入元素
    const element = document.getElementById(id);
    if (!element) {
      console.warn(`Element with id "${id}" not found`);
      return;
    }

    // 恢复占位符
    element.placeholder = PLACEHOLDERS[id] || 'Please enter';

    // 执行相应的输入验证
    switch (id) {
      case 'u':
        validateMobileInput(element);
        break;
      case 'k':
        validateKeyInput(element);
        break;
      case 'p':
        validatePasswordInput(element);
        break;
    }

    // 触发自定义验证事件
    const event = new CustomEvent('fieldValidation', {
      detail: {
        field: id,
        value: element.value,
        isValid: element.validity.valid
      }
    });
    document.dispatchEvent(event);

  } catch (error) {
    console.error('Error in blur handler:', error);
    ShowToast('输入验证出现错误', 'confirm');
  }
}

//3.1、手机号验证
// 2025-11-01
function validateMobileInput(element) {
  const value = element.value.trim();
  if (value) {
    if (!/^\d{11}$/.test(value)) {
      //请输入11位手机号码
      element.setCustomValidity('Please enter an 11 digit mobile phone number');
      // 手机号格式不正确
      ShowToast('The format of the phone number is incorrect', 'confirm');
    } else {
      element.setCustomValidity('');
    }
  }
}

//3.2、密钥验证
// 2025-11-01
function validateKeyInput(element) {
  const value = element.value.trim();
  if (value) {
    if (value.length !== 32) {
      //密钥必须为32位
      element.setCustomValidity('The key must be 32 bytes');
      //密钥长度不正确
      ShowToast('The key length is incorrect', 'confirm');
    } else {
      element.setCustomValidity('');
    }
  }
}

//3.3、密码验证
// 2025-11-01
function validatePasswordInput(element) {
  const value = element.value;
  if (value) {
    if (value.length < 6) {
      //密码至少需要6个字符
      element.setCustomValidity('The password needs to be at least 6 characters long');
      //密码长度不足
      ShowToast('Insufficient password length', 'confirm');
    } else {
      element.setCustomValidity('');
    }
  }
}
//4、登录事件
async function loginEvent() {
  if (
    document.getElementById("u").value.length < 11 ||
    document.getElementById("u").value == ""
  ) {
    // 手机号码不正确
    ShowToast("The phone number is not filled in correctly!", "Re-enter");
    return;
  }
  if ($("#p").val() == "") {
    // 
    ShowToast("Password not filled in!", "Re-enter");
    return;
  }

  sessionStorage.setItem("u", $("#u").val());
  sessionStorage.setItem(
    "p",
    hex_md5_utf($("#u").val() + $("#p").val()).toUpperCase()
  );

  if (localStorage["apiKey"] && keyStatus) {
    const decryptedK = await Decrypt(
      localStorage["apiKey"],
      sessionStorage["p"],
      sessionStorage["p"].substring(0, 12)
    );
    sessionStorage.setItem("k", decryptedK);
    if (sessionStorage["k"] == "") {
      ShowToast("Incorrect password", "Re-enter");
      return;
    }
  } else {
    if ($("#k").val().length < 11 || $("#k").val() == "") {
      ShowToast("The number of digits for the digital key must be 32 bytes！", "Re-enter");
      return;
    }
    sessionStorage.setItem("k", $("#k").val());
  }

  // 初始化全站全局超级API实例（userAccount/ApiKey 将在内部从 sessionStorage 回退获取）
  window.superAPI = createSuperAPI();

  loginInterface();
}
//4.1、登录接口（使用超级API）
async function loginInterface() {
  try {
    // 检查全站全局API实例是否已初始化
    if (!window.superAPI) {
      window.superAPI = createSuperAPI();
    }

    // 发送登录请求（签名将自动从 window.API_CONFIG.SIGN_MAP['I00001'] 获取）
    // request 已自动处理 status===1 和 data 提取，直接返回业务数据
    const data = await window.superAPI.request(
      'I00002',              // 登录接口ID
      {                      // 请求参数
        userEmail: sessionStorage["u"],
        userPassword: sessionStorage["p"],
        loginIp,
        loginLocation,
        loginOs,
        loginStatus:1,
        loginMsg:"WEB LOGIN"
      }
    );
    console.log("loginResponse", data);
    // 处理登录结果
    if (data && data.status) {
      try {
        // 解析JSON字段
        data.menuList = JSON.parse(data.menuList);
        data.leftData = JSON.parse(data.leftData);
        data.permissionSystem = JSON.parse(data.permissionSystem);
      } catch (e) {
        ShowToast("数据解析失败", "确定");
        return;
      }

      // 保存用户信息
      sessionStorage.setItem("USERINFO", JSON.stringify(data));
      //sessionStorage.setItem("menuIndex", "0");

      try {
        // 保存加密的APIKey到本地存储（注意 Encrypt 为异步）
        const cipher = await Encrypt(
          sessionStorage["k"],
          sessionStorage["p"],
          sessionStorage["p"].substring(0, 12)
        );
        localStorage.setItem("apiKey", cipher);
        localStorage.setItem("userAccount", sessionStorage["u"]);
      } catch (e) {
        ShowToast("本地存储失败", "confirm");
        return;
      }

      // 跳转到主页
      window.location.replace(data.url);
      console.log("loginData", data);
    } else {
      ShowToast((data.code || "") + " " + (data.message || "Login failed"), "confirm");
      document.getElementById("p").focus();
    }

  } catch (error) {
    console.error("登录错误:", error);
    ShowToast("登录失败: " + (error.message || "网络错误"), "confirm");
    document.getElementById("u").focus();
  }
}

// 旧版本登录接口（保留作为备用）
// function loginInterface_old() {
//   const p = {
//     u: sessionStorage["u"],
//     p: sessionStorage["p"],
//   };
//   $.ajax({
//     type: SCONFIGPOST.t,
//     url: SCONFIGPOST.u,
//     data: getPostData(p, SIN[0]),
//     contentType: SCONFIGPOST.c,
//     dataType: SCONFIGPOST.d,
//     beforeSend: function (xhr) {
//       xhr.setRequestHeader("u");
//     },
//     headers: { u: sessionStorage["u"] },
//     success: function (res) {
//       if (res.status === 1 && res.data) {
//         let D = res.data;
//         if (Array.isArray(D) && D[0]) D = D[0];
//         if (D.status) {
//           try {
//             D.menuList = JSON.parse(D.menuList);
//             D.leftData = JSON.parse(D.leftData);
//             D.permissionSystem = JSON.parse(D.permissionSystem);
//           } catch (e) {
//             ShowToast("数据解析失败", "确定");
//             return;
//           }
//           sessionStorage.setItem("USERINFO", JSON.stringify(D));
//           sessionStorage.setItem("menuIndex", "0");
//           try {
//             localStorage.setItem(
//               "apiKey",
//               Encrypt(
//                 sessionStorage["k"],
//                 sessionStorage["p"],
//                 sessionStorage["p"].substring(0, 12)
//               )
//             );
//             localStorage.setItem("userAccount", sessionStorage["u"]);
//           } catch (e) {
//             ShowToast("本地存储失败", "确定");
//             return;
//           }
//           window.location.replace(D.url);
//           console.log("loginData", D);
//         } else {
//           ShowToast((D.code || "") + " " + (D.message || "登录失败"), "confirm");
//           document.getElementById("p").focus();
//         }
//       } else {
//         ShowToast("4004 存储过程没有找到数据", "confirm");
//         document.getElementById("u").focus();
//       }
//     },
//     error: function () {
//       ShowToast("404 未找到（没有网络或服务器掉线）", "confirm");
//       document.getElementById("u").focus();
//     },
//   });
// }
//5、回车事件
function login_onkeydown(e) {
  // 确保跨浏览器兼容性
  const event = e || window.event;

  // 检查是否是回车键（支持 Enter 和 NumpadEnter）
  if (event.key === 'Enter' || event.keyCode === 13) {
    // 阻止默认行为
    event.preventDefault();

    // 检查输入字段是否有效
    const passwordField = document.getElementById('p');
    if (!passwordField || !passwordField.value) {
      // 密码未填写
      ShowToast('Please enter the password', 'confirm');
      return;
    }

    // 执行登录
    loginEvent();
  }
}
//6、获取本地配置
//读取本地存储信息
//2025-11-01
function getConfig() {
  if (localStorage["userAccount"]) {
    document.getElementById("u").value = localStorage["userAccount"];
    document.getElementById("p").focus();
  }
  else {
    document.getElementById("u").focus();
  }

  if (localStorage["apiKey"]) {
    keyStatus = true;
    document.getElementById("k").style.display = "none";
    document.getElementById("l").style.display = "block";
    document.getElementById("l2").style.display = "block";
    document.getElementById("b_code").style.display = "block";
    document.getElementById("b_code2").style.display = "none";
    document.getElementById("b_code3").style.display = "block";
  } else {
    keyStatus = false;
    document.getElementById("k").style.display = "block";
    document.getElementById("l").style.display = "none";
    document.getElementById("l2").style.display = "none";
    document.getElementById("b_code").style.display = "none";
    document.getElementById("b_code2").style.display = "none";
    document.getElementById("b_code3").style.display = "none";
  }
}
//7、卸载密钥
function d_lock() {
  if (codeStatus) {
    //扫码登录模式，密钥不允许卸载
    ShowToast("Scan code login mode, key cannot be uninstalled", "OK");
  } else {
    keyStatus = false;
    localStorage.removeItem("apiKey");
    localStorage.removeItem("userAccount");
    document.getElementById("u").value = "";
    document.getElementById("k").style.display = "block";
    document.getElementById("l").style.display = "none";
    document.getElementById("l2").style.display = "none";
    document.getElementById("b_code").style.display = "none";
    document.getElementById("b_code2").style.display = "none";
    document.getElementById("b_code3").style.display = "none";
    //密钥已卸载，请重新输入
    ShowToast("The key has been uninstalled, please re-enter", "OK");
  }
}
//8、切换成二维码
function enterCode() {
  if (codeStatus) {
    codeStatus = false;
    clearInterval(time);
    document.getElementById("u").style.display = "block";
    document.getElementById("p").style.display = "block";
    document.getElementById("b_code").style.display = "block";
    document.getElementById("b_code2").style.display = "none";
    document.getElementById("canvasId").style.display = "none";
    //document.getElementById("l").style.display = 'block';
    //document.getElementById("l2").style.display = 'block';
    document.getElementById("but").style.display = "block";
    document.getElementById("bottomStyle").style.height = "200px";
    document.getElementById("canvasId").innerHTML = "";
  } else {
    codeStatus = true;
    document.getElementById("u").style.display = "none";
    document.getElementById("p").style.display = "none";
    document.getElementById("b_code").style.display = "none";
    document.getElementById("b_code2").style.display = "block";
    document.getElementById("canvasId").style.display = "block";
    //document.getElementById("l").style.display = 'none';
    //document.getElementById("l2").style.display = 'none';
    document.getElementById("but").style.display = "none";
    document.getElementById("bottomStyle").style.height = "125px";
    var timestamp = new Date().getTime();
    var code = hex_md5_utf(timestamp + "SuperSystem").toUpperCase();
    new QRCode(document.getElementById("canvasId"), {
      text: (window.API_CONFIG && window.API_CONFIG.BASE_URL ? window.API_CONFIG.BASE_URL : '') + "/scanlogin/" + code,
      width: 200,
      height: 200,
    });
    time = setInterval(function () {
      qrcodeLogin(timestamp, code);
    }, 2000);
  }
}
//9、二维码登录接口
//每2秒请求接口
function qrcodeLogin(t, code) {
  var p = {
    t: t,
    c: code,
  };
  $.ajax({
    type: SCONFIG.t,
    url: (window.API_CONFIG && window.API_CONFIG.BASE_URL ? window.API_CONFIG.BASE_URL : '') + "/scanlogin/qrCodeWebLogin",
    data: "data=" + JSON.stringify(p).replace("{", "%7B").replace("}", "%7D"),
    contentType: SCONFIG.c,
    dataType: SCONFIG.d,
    success: async function (res) {
      console.log(res);
      if (res.status == 1 && res.data !== null) {
        var D = res.data;
        if (res.data[0]) {
          D = res.data[0];
        }
        if (D.status) {
          const str = await Decrypt(
            D.data,
            code.substring(0, 16),
            code.substring(16)
          );
          if (str) {
            var userIn = JSON.parse(str);
            sessionStorage.setItem("u", userIn.u);
            sessionStorage.setItem("p", userIn.p);
            const k2 = await Decrypt(
              localStorage["apiKey"],
              sessionStorage["p"],
              sessionStorage["p"].substring(0, 12)
            );
            sessionStorage.setItem("k", k2);
            loginInterface();
          } else {
            ShowToast("数据被撰改，无法解密", "知道了");
            enterCode();
          }
        } else {
          if (D.code == 3003 || D.code == 3002) {
            ShowToast(D.code + " " + D.message, "confirm");
            enterCode();
          }
        }
      } else {
        ShowToast("4004 存储过程没有找到数据", "confirm");
        enterCode();
      }
    },
    error: function (e) {
      ShowToast("404 未找到（没有网络或服务器掉线）", "confirm");
      enterCode();
    },
  });
}
