"use strict";

// 更新下拉選單文本並篩選結果
function updateDropdown(element, filter) {
  document.getElementById('dropdownMenuButton').innerText = filter; // 更新按鈕文字
  // 移除所有下拉項目的 active class
  let dropdownItems = document.querySelectorAll('.dropdown-item');
  dropdownItems.forEach(item => item.classList.remove('active'));

  // 將當前點擊的項目設置為 active
  element.classList.add('active');
  filterTable(filter); // 根據選擇篩選表格
}

// 根據篩選條件顯示表格
function filterTable(filter) {
  var filteredData;
  if (filter === '全部') {
    filteredData = cert_record;  // 顯示全部
  } else {
    filteredData = cert_record.filter(function(item) {
      return getStatusText(item.cert_status) === filter;  // 根據狀態篩選
    });
  }
  renderTable(filteredData);
}

// 渲染表格數據
function renderTable(data) {
  var tableBody = document.getElementById('cert-table-body');
  tableBody.innerHTML = ''; // 清空表格

  data.forEach(function (item, index) {
    var row = document.createElement('tr');

    // 根据 cert_status 确定按钮样式
    let statusButton;
    if (getStatusText(item.cert_status) === '已通過') {
      statusButton = `<div class="btn btn-outline-success">${getStatusText(item.cert_status)}</div>`;
    } else if (getStatusText(item.cert_status) === '審核中') {
      statusButton = `<div class="btn btn-outline-warning">${getStatusText(item.cert_status)}</div>`;
    } else if (getStatusText(item.cert_status) === '未通過') {
      // 给未通过按钮添加 data-cert-id 属性用于区分
      statusButton = `<div class="btn btn-outline-danger cert_btn" data-cert-id="${item.certrecord_id}">${getStatusText(item.cert_status)}</div>`;
    }

    // 设置行内容
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${item.cert_name}</td>
      <td>${item.cert_program}</td>
      <td>${moment(item.cert_date).format('YYYY-MM-DD')}</td>
      <td style="width: 115.09px;">${statusButton}</td>
    `;

    tableBody.appendChild(row);
  });

  // 绑定点击事件
  bindDangerButtonClick(data);
}

function bindDangerButtonClick(data) {
  // 使用事件委托方式绑定 .btn-outline-danger 按钮
  document.getElementById('cert-table-body').addEventListener('click', function (event) {
    if (event.target.classList.contains('btn-outline-danger')) {
      const certId = event.target.getAttribute('data-cert-id');
      const certData = data.find(cert => cert.certrecord_id == certId);
      $("#cert_id_edit").val(certData.certrecord_id);
      $("#cert_name_edit").val(certData.cert_name);
      $("#cert_program_edit").val(certData.cert_program);
      $("#cert_date_edit").val(moment(certData.cert_date).format('YYYY-MM-DD'));
      $("#file_edit").val();
      
      // 预览图片
      const imageElement = document.getElementById("uploadedImage_edit");
      if (certData.cert_pic) {
        imageElement.src = certData.cert_pic; // 设置 Base64 图片地址
        imageElement.style.display = "block"; // 显示图片
      } else {
        imageElement.style.display = "none"; // 如果没有图片，隐藏预览
      }
      $('#cert_btn').click();
    }
  });
}


// 將狀態數字轉換為文本
function getStatusText(status) {
  switch (status) {
    case '1': return '已通過';
    case '2': return '審核中';
    case '3': return '未通過';
    default: return '未知';
  }
}

// 預設顯示全部證照
document.addEventListener('DOMContentLoaded', function() {
  renderTable(cert_record);  // 初始化顯示所有證照
});


// 更新「推薦證照」下拉選單文本並篩選結果
function updateRecommendedCertDropdown(element, filter) {
  document.getElementById('dropdownMenuButton2').innerText = filter; // 更新按鈕文字

  // 移除所有下拉項目的 active class
  let dropdownItems = document.querySelectorAll('#dropdownMenuButton2 + .dropdown-menu .dropdown-item');
  dropdownItems.forEach(item => item.classList.remove('active'));

  // 將當前點擊的項目設置為 active
  element.classList.add('active');

  // 根據選擇篩選「推薦證照」表格
  filterRecommendedCerts(filter); 
}

// 根據篩選條件顯示「推薦證照」表格
function filterRecommendedCerts(filter) {
  let filteredData;
  if (filter === '全部') {
      filteredData = cert_data;  // 顯示全部
  } else {
      filteredData = cert_data.filter(item => item.cert_program === filter); // 根據認證科目篩選
  }
  renderRecommendedCertTable(filteredData);
}

// 渲染「推薦證照」表格數據
function renderRecommendedCertTable(data) {
  const tableBody = document.getElementById('cert-table-body2');
  tableBody.innerHTML = '';  // 清空表格

  data.forEach((item, index) => {
    const row = document.createElement('tr');
    // 生成星星字符串
    const stars = '⭐'.repeat(item.cert_difficulty); // 根據 cert_difficulty 生成星星
      row.innerHTML = `
          <td>${index + 1}</td>
          <td>${item.cert_name}</td>
          <td>${item.cert_program}</td>
          <td>${stars}⭐</td>
      `;
      tableBody.appendChild(row);
  });
}

document.addEventListener('DOMContentLoaded', function() {
  renderRecommendedCertTable(cert_data);  // 初始化顯示所有「推薦證照」
});


const MAX_FILE_SIZE = 16 * 1024 * 1024; // 16MB
const ALLOWED_EXTENSIONS = ["jpg", "jpeg", "png", "webp"];

var pic_msg = document.getElementById("pic_msg"); // 获取 msg 元素
var img_data = document.getElementById("uploadedImage");
var submit_msg = document.getElementById("submit_msg");

var pic_msg_edit = document.getElementById("pic_msg_edit"); // 获取 msg 元素
var img_data_edit = document.getElementById("uploadedImage_edit");
var submit_msg_edit = document.getElementById("submit_msg_edit");

document.getElementById("uploadButton").addEventListener("click", function() {
  document.getElementById("file").click();
});

document.getElementById("uploadButton_edit").addEventListener("click", function () {
  document.getElementById("file_edit").click();
});

function detectFileType(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (event) {
      const arrayBuffer = event.target.result;
      const bytes = new Uint8Array(arrayBuffer);

      // Example magic numbers (you may need more or different ones depending on file types)
      const magicNumbers = {
        'jpg': [0xFF, 0xD8, 0xFF],
        'png': [0x89, 0x50, 0x4E, 0x47],
        'gif': [0x47, 0x49, 0x46, 0x38],
        'webp': [0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50]
      };

      let detectedType = null;

      for (const [type, magic] of Object.entries(magicNumbers)) {
        if (bytes.slice(0, magic.length).every((val, index) => val === magic[index])) {
          detectedType = type;
          break;
        }
      }

      resolve(detectedType);
    };
    reader.onerror = reject;

    // Read the first 12 bytes to cover all examples
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

document.getElementById("file").addEventListener("change", async function () {
  var file = this.files[0];
  if (file) {
    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      img_data.style.display = 'none'; // 隐藏图片
      pic_msg.textContent = `上傳圖片過大，圖片大小最大為 ${MAX_FILE_SIZE / 1024 / 1024} MB。`;
      pic_msg.style.color = "red";
      return;
    }
    
    try {
      const fileType = await detectFileType(file);
      if (fileType && ALLOWED_EXTENSIONS.includes(fileType)) {
        // 文件有效，读取并显示
        var reader = new FileReader();
        reader.onload = function (e) {
          pic_msg.textContent = ''
          img_data.src = e.target.result;
          img_data.style.display = 'block'; // 显示图片
        };
        reader.readAsDataURL(file);
      } else {
        // img_data.src = "";
        img_data.style.display = 'none'; // 隐藏图片
        pic_msg.textContent = "僅能上傳圖片副檔名為: jpg、jpeg、png、webp";
        pic_msg.style.color = "red";
        // $("#updateModal").modal("show");
      }
    } catch (error) {
      // img_data.src = "";
      img_data.style.display = 'none'; // 隐藏图片
      pic_msg.textContent = "無法辨識圖片檔案，請更換圖片上傳";
      pic_msg.style.color = "red";
      // $("#updateModal").modal("show");
    }
  }
});

document.getElementById("file_edit").addEventListener("change", async function () {
  var file = this.files[0];
  if (file) {
    // 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      img_data_edit.style.display = 'none'; // 隐藏图片
      pic_msg_edit.textContent = `上傳圖片過大，圖片大小最大為 ${MAX_FILE_SIZE / 1024 / 1024} MB。`;
      pic_msg_edit.style.color = "red";
      return;
    }
    
    try {
      const fileType = await detectFileType(file);
      if (fileType && ALLOWED_EXTENSIONS.includes(fileType)) {
        // 文件有效，读取并显示
        var reader = new FileReader();
        reader.onload = function (e) {
          pic_msg_edit.textContent = ''
          img_data_edit.src = e.target.result;
          img_data_edit.style.display = 'block'; // 显示图片
        };
        reader.readAsDataURL(file);
      } else {
        // img_data.src = "";
        img_data_edit.style.display = 'none'; // 隐藏图片
        pic_msg_edit.textContent = "僅能上傳圖片副檔名為: jpg、jpeg、png、webp";
        pic_msg_edit.style.color = "red";
        // $("#updateModal").modal("show");
      }
    } catch (error) {
      // img_data.src = "";
      img_data_edit.style.display = 'none'; // 隐藏图片
      pic_msg_edit.textContent = "無法辨識圖片檔案，請更換圖片上傳";
      pic_msg_edit.style.color = "red";
      // $("#updateModal").modal("show");
    }
  }
});