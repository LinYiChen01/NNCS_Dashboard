"use strict";

document.getElementById("st_pay_date").setAttribute("max", moment(new Date()).format('YYYY-MM-DD'));


// 點 X 清除搜尋框文字
function clearInput() {
  document.getElementById("searchInput").value = ""; // 清空輸入框
  populateTable(st_data); // 恢復顯示所有學生資料
  toggleClearButton(); // 更新清除按鈕的顯示
}

// Enter 搜尋
document
  .getElementById("searchInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      searchTable(); // 當按下 Enter 鍵時觸發搜尋
    }
  });

document.getElementById("st_pay_add").addEventListener("click", async () => {
    const st_id = document.getElementById("st_id").value;
    const st_pay = document.getElementById("st_pay").value;
    const st_pay_num = document.getElementById("st_pay_num").value;
    const st_way = document.getElementById("st_way").value;
    const st_pay_date = document.getElementById("st_pay_date").value;

    const response = await fetch('/search_st_tuiton', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ st_id })
    });
    const data = await response.json();

    if (!st_id || !st_pay || !st_pay_num || !st_way || !st_pay_date) {
      document.getElementById("st_pay_add_message").innerHTML = "<span style='color: red;'>資料不完整，請重新輸入!</span>"; 
    }
    else { 
      if (!data.st_id) {
        document.getElementById("st_pay_add_message").innerHTML = "<span style='color: red;'>新增失敗，查無此學號!</span>";
      }
      else {
        if (st_pay_num < 1) {
          document.getElementById("st_pay_add_message").innerHTML = "<span style='color: red;'>新增失敗，期數不可以小於0!</span>";
        }
        else {
          fetch('/insert_st_tuiton', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              st_id,
              st_pay,
              st_pay_num,
              st_way,
              st_pay_date
            })
          })
          .then(response => response.json())
          .then(data => {
            // 根據返回的結果顯示成功或失敗訊息
            if (data.success) {
              document.getElementById("st_pay_add_message").innerHTML = "<span>新增成功</span>";
            } else {
              document.getElementById("st_pay_add_message").innerHTML = "<span style='color: red;'>新增失敗，請再試一次！</span>";
            }
          })
          .catch(error => {
            document.getElementById("st_pay_add_message").innerHTML = "<span style='color: red;'>系統錯誤，請稍後再試！</span>";
          });
        }
        
      }
  }
  $("#st_id").val("");
  $("#st_pay").val("");
  $("#st_pay_num").val("");
  $("#st_way").val("");
  $("#st_pay_date").val("");
  
});




    // fetch("/submit", {
    //     method: "POST",
    //     headers: { "Content-Type": "application/json" },
    //     body: JSON.stringify({ st_id, st_pay, st_pay_num, st_pay_date })
    // }).then(response => response.json())
    //   .then(data => console.log(data));
// });

