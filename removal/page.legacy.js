// 历史遗留业务弹窗与富文本编辑器（已废弃，仅供参考）
// 移除原因：当前项目无任何页面调用 ShowWin，且包含硬编码业务逻辑

let editorConfig = {
  placeholder: "请输入内容",
  MENU_CONF: {
    uploadImage: {
      server: "https://www.wuyexin.cn/rest/wyx_common_upload?quality=0.7",
      maxFileSize: 1 * 1024 * 1024, // 1M
      allowedFileTypes: ["image/*"],
      headers: {
        Authorization:
          "Basic dHVmam5iNDZyZmNia2l1dHJmOmF1YWRma1VKSEdUWUhHYXNkZmFeKl4lIyYqPD5rLC5hc2RmYXM=",
      },
      customInsert(res, insertFn) {
        if (res.status == 1) {
          const url = res.data;
          insertFn(url, url, url);
        } else {
          parent.ShowToast(res.message, "确定");
        }
      },
    },
  },
};

let editor = null;
let toolbarConfig = {};
let toolbar = null;

// 通用业务弹窗函数（支持富文本编辑器、二维码、业务数据回填）
function ShowWin(data, render, ed, info, className) {
  if (data) {
    document.getElementById("winContetnt").innerHTML = data.d;
    document.getElementById("titleA").innerHTML = data.a;
    document.getElementById("win").style.height = data.h;
    document.getElementById("win").style.width = data.w;
    switch (data.appId) {
      case "S187202202050031":
        excelJson = "";
        break;
      default:
        break;
    }
  }
  document.getElementById("POPUPWIN").style.visibility = "visible";
  document.getElementById("win").setAttribute("class", "winform move");

  if (render && render.url) {
    new QRCode($(`#${render.ele}`)[0], {
      text: render.url,
      height: render.size,
      width: render.size,
    });
  }

  if (ed) {
    const { createEditor, createToolbar } = window.wangEditor;

    switch (ed.id) {
      case "policyEditor":
        if (ed.content) {
          let data = JSON.parse(ed.content);
          sessionStorage.setItem("editPolicyId", data[0].policyId);
          $("#policyTitle").val(data[0].policyTitle);
          $("#policyTime").val(data[0].policyTime.split(" ")[0]);
          $("#policyTypeId").val(data[0].policyTypeId);
          editor = createEditor({
            selector: "#policyEditor",
            html: data[0].policyContent,
            config: editorConfig,
            mode: "default",
          });
        } else {
          editor = createEditor({
            selector: "#policyEditor",
            html: "",
            config: editorConfig,
            mode: "default",
          });
        }
        break;

      case "propertyEditor":
        if (ed.content) {
          const info = ed.content;
          $("#propertyImg").attr("src", info.imgUrl);
          $("#propertyNickName").val(info.cpcName);
          $("#propertyName").val(info.cpcFullName);
          $("#propertyTime").val(info.cpcDate.split(" ")[0]);
          $("#propertyGpsX").val(info.gpsX);
          $("#propertyGpsY").val(info.gpsY);

          searchProperty(true);
          editor = createEditor({
            selector: "#propertyEditor",
            html: info.cpcIntroduction,
            config: editorConfig,
            mode: "default",
          });
        } else {
          editor = createEditor({
            selector: "#propertyEditor",
            html: "",
            config: editorConfig,
            mode: "default",
          });
        }
        break;

      default:
        break;
    }

    toolbar = createToolbar({
      editor,
      selector: "#toolbar-container",
      config: toolbarConfig,
      mode: "default",
    });

    toolbar.getConfig().toolbarKeys = [
      "headerSelect",
      "blockquote",
      "|",
      "bold",
      "underline",
      "italic",
      {
        key: "group-more-style",
        title: "更多",
        iconSvg:
          '<svg viewBox="0 0 1024 1024"><path d="M204.8 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M505.6 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path><path d="M806.4 505.6m-76.8 0a76.8 76.8 0 1 0 153.6 0 76.8 76.8 0 1 0-153.6 0Z"></path></svg>',
        menuKeys: ["through", "code", "sup", "sub", "clearStyle"],
      },
      "color",
      "bgColor",
      "|",
      "fontSize",
      "fontFamily",
      "lineHeight",
      "|",
      "bulletedList",
      "numberedList",
      "todo",
      {
        key: "group-justify",
        title: "对齐",
        iconSvg:
          '<svg viewBox="0 0 1024 1024"><path d="M768 793.6v102.4H51.2v-102.4h716.8z m204.8-230.4v102.4H51.2v-102.4h921.6z m-204.8-230.4v102.4H51.2v-102.4h716.8zM972.8 102.4v102.4H51.2V102.4h921.6z"></path></svg>',
        menuKeys: [
          "justifyLeft",
          "justifyRight",
          "justifyCenter",
          "justifyJustify",
        ],
      },
      {
        key: "group-indent",
        title: "缩进",
        iconSvg:
          '<svg viewBox="0 0 1024 1024"><path d="M0 64h1024v128H0z m384 192h640v128H384z m0 192h640v128H384z m0 192h640v128H384zM0 832h1024v128H0z m0-128V320l256 192z"></path></svg>',
        menuKeys: ["indent", "delIndent"],
      },
      "|",
      "insertLink",
      {
        key: "group-image",
        title: "图片",
        iconSvg:
          '<svg viewBox="0 0 1024 1024"><path d="M959.877 128l0.123 0.123v767.775l-0.123 0.122H64.102l-0.122-0.122V128.123l0.122-0.123h895.775zM960 64H64C28.795 64 0 92.795 0 128v768c0 35.205 28.795 64 64 64h896c35.205 0 64-28.795 64-64V128c0-35.205-28.795-64-64-64zM832 288.01c0 53.023-42.988 96.01-96.01 96.01s-96.01-42.987-96.01-96.01S682.967 192 735.99 192 832 234.988 832 288.01zM896 832H128V704l224.01-384 256 320h64l224.01-192z"></path></svg>',
        menuKeys: ["insertImage", "uploadImage"],
      },
      "insertTable",
      "codeBlock",
      "divider",
      "|",
      "undo",
      "redo",
      "|",
    ];
  }

  // 业务数据回填逻辑（硬编码特定接口 S231202406260555）
  if (info && info.name == "point") {
    if (info.isEntrance == "1") {
      $(".isEntranceAdv").show();
      $(".winform").css("height", "595px");
    } else {
      $(".isEntranceAdv").hide();
    }
    if (info.deep != "0") {
      $("#parentIdContainer").show();
      $("#deepsContainer").css("transform", "translateX(-30px)");
      const p = {
        userMobile: sessionStorage.getItem("u"),
        communityId: sessionStorage.getItem("communityId"),
        findType: "0",
        keyWord: "",
        deep: String(Number(info.deep) - 1),
      };
      $.ajax({
        type: SCONFIGPOST.t,
        url: SCONFIGPOST.u,
        data: getPostData(p, "S231202406260555"),
        contentType: SCONFIGPOST.c,
        dataType: SCONFIGPOST.d,
        success: function (res) {
          if (res.status == 1 && res.data[0].status == 1) {
            const data = JSON.parse(res.data[0].data);
            let str = `<option value="">请选择</option>`;
            str += data
              .map(
                (m) =>
                  `<option value="${m.pointId}" ${
                    info.parentId == m.pointId ? "selected" : ""
                  }>${m.pointName}</option>`
              )
              .join("");
            $("#parentId").html(str);
          } else {
            closeWin();
            ShowToast(res.data[0].message, "确定");
          }
        },
        error: function (e) {
          ShowToast(e.message, "确定");
        },
      });
    }
  }

  if (info && info.name == "gate") {
    const p = {
      userMobile: sessionStorage.getItem("u"),
      communityId: sessionStorage.getItem("communityId"),
      findType: "1",
      keyWord: info.pointName,
      deepS: "",
    };
    $.ajax({
      type: SCONFIGPOST.t,
      url: SCONFIGPOST.u,
      data: getPostData(p, "S231202406260555"),
      contentType: SCONFIGPOST.c,
      dataType: SCONFIGPOST.d,
      success: function (res) {
        if (res.status == 1 && res.data[0].status == 1) {
          var pointData = JSON.parse(res.data[0].data);
          if (pointData.length) {
            let pointStr = '<option value="">请选择</option>';
            pointStr += pointData
              .map(
                (m) =>
                  `<option value="${m.pointId}" ${
                    m.pointId == info.pointId ? "selected" : ""
                  }>${m.pointName}</option>`
              )
              .join("");
            $("#pointId").html(pointStr);
          } else {
            $("#pointId").html('<option value="">请选择</option>');
            ShowToast("查无数据", "确定");
          }
        } else {
          ShowToast(res.data[0].message, "确定");
        }
      },
      error: function (e) {
        ShowToast(e.message, "确定");
      },
    });
  }

  if (info && info.name == "fireControl") {
    const p = {
      userMobile: sessionStorage.getItem("u"),
      communityId: sessionStorage.getItem("communityId"),
      findType: "1",
      keyWord: info.pointName,
      deepS: "",
    };
    $.ajax({
      type: SCONFIGPOST.t,
      url: SCONFIGPOST.u,
      data: getPostData(p, "S231202406260555"),
      contentType: SCONFIGPOST.c,
      dataType: SCONFIGPOST.d,
      success: function (res) {
        if (res.status == 1 && res.data[0].status == 1) {
          var pointData = JSON.parse(res.data[0].data);
          if (pointData.length) {
            let pointStr = '<option value="">请选择</option>';
            pointStr += pointData
              .map(
                (m) =>
                  `<option value="${m.pointId}" ${
                    m.pointId == info.pointId ? "selected" : ""
                  }>${m.pointName}</option>`
              )
              .join("");
            $("#pointId").html(pointStr);
          } else {
            $("#pointId").html('<option value="">请选择</option>');
            ShowToast("查无数据", "确定");
          }
        } else {
          ShowToast(res.data[0].message, "确定");
        }
      },
      error: function (e) {
        ShowToast(e.message, "确定");
      },
    });
  }
}

// 高德地图加载（业务专用）
function mapLoad(gpsX, gpsY, userImg, userName, box) {
  var map = new AMap.Map("container", {
    zoom: 16,
    center: [parseFloat(gpsX), parseFloat(gpsY)],
    mapStyle: "amap://styles/whitesmoke",
  });
  var infoWindow = new AMap.InfoWindow({
    isCustom: true,
    content:
      '<div class="TX-win"><a href="' +
      userImg +
      '" target="_blank"><img src="' +
      userImg +
      '" class="TX-1" ' +
      (box ? 'style="border-radius: 6px;width:200px;height:150px;"' : "") +
      ' title="' +
      userName +
      '" alt="新管家"/></a><div class="demo"></div></div>',
  });
  infoWindow.open(map, map.getCenter());
  map.on("complete", function () {
    // 地图图块加载完成后触发
  });
}
