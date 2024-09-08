"use strict";

// 彈出視窗時背景虛化
function showBlur() {
  document.getElementById('blurLayer').classList.add('show');
}

function removeBlur() {
  document.getElementById('blurLayer').classList.remove('show');
}

// 监听模态框关闭事件以移除背景虚化
$('#updateModal').on('hidden.bs.modal', function () {
  removeBlur();
});

// 提交表單更新資料
function submitUpdateForm() {
  // 獲取表單資料
  // const phone1 = document.getElementById('phone1').value;
  // const phone2 = document.getElementById('phone2').value;
  // const email = document.getElementById('email').value;
  // const address = document.getElementById('address').value;
  // const workplace = document.getElementById('workplace').value;
  // const profession = document.getElementById('profession').value;

  // // 更新顯示的資料
  // document.querySelector('input[name="phone1"]').value = phone1;
  // document.querySelector('input[name="phone2"]').value = phone2;
  // document.querySelector('input[name="email"]').value = email;
  // document.querySelector('input[name="address"]').value = address;
  // document.querySelector('input[name="workplace"]').value = workplace;
  // document.querySelector('input[name="profession"]').value = profession;

  // 隱藏模態框
  $('#updateModal').modal('hide');
}
