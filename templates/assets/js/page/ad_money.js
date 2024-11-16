"use strict";

document.getElementById("st_pay_date").setAttribute("max", moment(new Date()).format('YYYY-MM-DD'));

// 繳費紀錄表格渲染函數
function renderPaymentRecords(records) {
  const tbody = document.getElementById("money_table_body")
  tbody.innerHTML = ''; // 清空表格內容

  records.forEach(record => {
      const row = document.createElement('tr');

      // 插入每一列資料
      row.innerHTML = `
          <tr>
            <td>${record.st_id}</td>
            <td>${record.money_semester}</td>
            <td>${record.money_details}</td>
            <td>${record.money_way}</td>
            <td>${moment(record.money_date).format('YYYY-MM-DD')}</td>
            <td>${record.class_num}/20</td>
            <td>
              ${record.class_num >= 20 
                ? '<button class="btn btn-danger btn-action leave-btn disabled" disabled><i class="fas fa-trash"></i></button>' 
                : `<a class="btn btn-danger btn-action leave-btn" data-id="${record.money_id}" href="#"><i class="fas fa-trash"></i></a>`
              }
            </td>
          </tr>`;

      tbody.appendChild(row);
  });
}

// 初始化顯示繳費紀錄
renderPaymentRecords(money_record);


// 點 X 清除搜尋框文字
function clearInput() {
  document.getElementById("searchInput").value = ""; // 清空輸入框
  renderPaymentRecords(money_record); // 更新表格
}

// Enter 搜尋
document
  .getElementById("searchInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      searchTable(); // 當按下 Enter 鍵時觸發搜尋
    }
  });


function searchTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const filteredData = money_record.filter((student) => {
    return (
      student.st_id.toString().includes(input)
    );
  });
  renderPaymentRecords(filteredData); // 更新表格
}
  

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
              console.log(data.money_record);
              console.log(data.currnet_st_id);
              let tbodyContent = "";
              data.money_record.forEach(record => {
                console.log('record.st_id', record.st_id, 'data.currnet_st_id', data.currnet_st_id);
                if (record.st_id == data.currnet_st_id) { // 只显示当前学生的记录
                  tbodyContent += `
                    <tr>
                      <td>${record.st_id}</td>
                      <td>${record.money_semester}</td>
                      <td>${record.money_details}</td>
                      <td>${record.money_way}</td>
                      <td>${moment(record.money_date).format('YYYY-MM-DD')}</td>
                      <td>${record.class_num}/20</td>
                      <td>
                        ${record.class_num >= 20 
                          ? '<button class="btn btn-danger btn-action leave-btn disabled" disabled><i class="fas fa-trash"></i></button>' 
                          : `<a class="btn btn-danger btn-action leave-btn" data-id="${record.money_id}" href="#"><i class="fas fa-trash"></i></a>`
                        }
                      </td>
                    </tr>`;
                }
              });
            
              document.getElementById("money_table_body").innerHTML = tbodyContent;
              console.log('tbodyContent', tbodyContent);
            } else {
              document.getElementById("st_pay_add_message").innerHTML = "<span style='color: red;'>新增失敗，請再試一次！</span>";
            }
          })
            .catch(error => {
              console.log(error);
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


