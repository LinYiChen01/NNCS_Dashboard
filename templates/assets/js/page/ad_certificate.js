"use strict";

// 渲染表格數據
function renderTable(data) {
  var tableBody = document.getElementById('cert-table-body');
  tableBody.innerHTML = '';  // 清空表格

  data.forEach(function (item) {
    if (item.cert_status == "2") { 
      var row = document.createElement('tr');

      // 将 row.innerHTML 设置为完整的字符串
      row.innerHTML = `
        <td>${item.st_id}</td>
        <td>${item.cert_name}</td>
        <td>${item.cert_program}</td>
        <td>${moment(item.cert_date).format('YYYY-MM-DD')}</td>
        <td><a class="btn btn-primary btn-action mr-1 edit-btn" data-id="${item.cert_id}"><i class="fas fa-eye"></i></a></td>
      `;
      tableBody.appendChild(row);
    }
  });
  document.querySelectorAll('.edit-btn').forEach(button => {
    button.addEventListener('click', function() {
        const certId = this.getAttribute('data-id');
        const cert_data = data.find(student => student.cert_id == certId);
        $('#cert_name').text(cert_data.cert_name); 
        $('#cert_program').text(cert_data.cert_program); 
        $('#cert_date').text(moment(cert_data.cert_date).format('YYYY-MM-DD'));
        $('#cert_file').attr('src', cert_data.cert_pic); 
        $('#cert_id').val(cert_data.cert_id); 
        
        $('#ad_cert_check').click();
    });
 });
}


// 預設顯示全部證照
document.addEventListener('DOMContentLoaded', function() {
  renderTable(st_cert);  // 初始化顯示所有證照
});

function clearInput() {
  document.getElementById('searchInput').value = ''; // 清空輸入框
  const tableBody = document.getElementById('cert-table-ok-body'); // 获取表格的 `<tbody>` 元素
  tableBody.innerHTML = ''; // 清空表格内容
}

// 監聽輸入框的 Enter 鍵
document.getElementById('searchInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        searchTable(); // 當按下 Enter 鍵時觸發搜尋
    }
});

function searchTable() {
  const input = document.getElementById('searchInput').value.toLowerCase();
  const filteredData = st_cert.filter(student => {
      return student.st_id.toString().includes(input) || 
             student.cert_name.toLowerCase().includes(input) || 
             student.cert_program.toLowerCase().includes(input);
  });
  populateTable(filteredData); // 更新表格
}

function populateTable(data) {
  const tableBody = document.getElementById('cert-table-ok-body'); // 获取表格的 `<tbody>` 元素
  tableBody.innerHTML = ''; // 清空表格内容

  // 遍历数据数组
  data.forEach(student => {
    if (student.cert_status == "1") { 
      const row = document.createElement('tr'); // 创建一行 `<tr>`

      // 设置行内容，假设表格有以下列：学号、姓名、家长姓名、电话1、电话2
      row.innerHTML = `
          <td>${student.st_id}</td>
          <td>${student.cert_name}</td>
          <td>${student.cert_program}</td>
          <td>${moment(student.cert_date).format('YYYY-MM-DD')}</td>
          <td><a class="btn btn-danger btn-action mr-1 delete-btn" data-id="${student.cert_id}"><i class="fas fa-times"></i></a></td>
      `;
      // 将行追加到表格体
      tableBody.appendChild(row);
    }
    document.querySelectorAll('.delete-btn').forEach(button => {
      button.addEventListener('click', function() {
          const certId = this.getAttribute('data-id');
          const cert_data = data.find(student => student.cert_id == certId);
          $('#cert_name_del').text(cert_data.cert_name); 
          $('#cert_program_del').text(cert_data.cert_program); 
          $('#cert_date_del').text(moment(cert_data.cert_date).format('YYYY-MM-DD'));
          $('#cert_file_del').attr('src', cert_data.cert_pic); 
          $('#cert_id_del').val(cert_data.cert_id); 
          
          $('#ad_cert_delete').click();
      });
   });    
  });
}

