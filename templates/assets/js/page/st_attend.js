"use strict";

function clearInput() {
  document.getElementById("searchInput").value = ""; // 清空輸入框
  const tableBody = document.getElementById("studentTableBody");
  tableBody.innerHTML = ""; // 清空表格內容
}

// 監聽輸入框的 Enter 鍵
document
  .getElementById("searchInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      searchTable(); // 當按下 Enter 鍵時觸發搜尋
    }
  });

function searchTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();

  // 通過 AJAX 向後端發送請求
  $.ajax({
    url: "/search_st_attend", // 替換為你的後端 API 路徑
    method: "POST", // 假設是 POST 請求
    contentType: "application/json",
    data: JSON.stringify({ data: input }),
    success: function (response) {
      // 更新表格
      // console.log('response', response);
      populateTable(response["attend_data"]);
    },
    error: function (xhr, status, error) {
      console.error("查詢失敗:", error);
      // alert('查詢失敗，請稍後再試');
    },
  });
}

function populateTable(data) {
  const tableBody = document.getElementById("studentTableBody");
  tableBody.innerHTML = ""; // 清空表格內容

  data.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${moment(student.class_date).format("YYYY-MM-DD")}</td>
            <td>${student.classroom_name}</td>
            <td>${
              "禮拜 " +
              student.class_week +
              " " +
              student.start_time +
              "-" +
              student.end_time
            }</td>
            <td>${student.course_name + "-" + student.progress}</td>
            <td>${student.tr_name}</td>
            <td>${student.status}</td>
            <td style="width: 100px;">
                <a class="btn btn-primary btn-action mr-1 edit-btn" data-id="${
                  student.attend_id
                }"><i class="fas fa-pencil-alt"></i></a>
            </td>
        `;
    tableBody.appendChild(row);
  });
  // 為每個編輯按鈕添加點擊事件
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const attendId = this.getAttribute("data-id");
      const studentData = data.find((student) => student.attend_id == attendId);
      $("#st_id_attend").text(studentData.st_id);
      $("#st_id_attend_input").val(studentData.st_id);
      $("#st_name_attend").text(studentData.st_name);
      $("#st_date_attend").text(studentData.st_id);
      $("#st_classtime_id_attend").val(studentData.classtime_id);
      $("#st_date_attend").text(
        moment(studentData.class_date).format("YYYY-MM-DD")
      );
      $("#st_date_attend_input").val(
        moment(studentData.class_date).format("YYYY-MM-DD")
      );
      $("#st_classroom_attend").text(studentData.classroom_name);
      $("#st_classtime_attend").text(
        "禮拜 " +
          studentData.class_week +
          " " +
          studentData.start_time +
          "-" +
          studentData.end_time
      );
      $("#st_tr_attend").text(studentData.tr_name);
      if (studentData.course_id != "") {
        // 選擇對應課程 ID 作為預設值
        $("#st_course_attend").val(studentData.course_id);
      } else {
        // 設置預設值為 "請選擇課程"
        $("#st_course_attend").val("");
      }

      // 動態生成課程清單
      $("#st_course_attend").append(
        course_data
          .map(
            (c) => `<option value="${c.course_id}">${c.course_name}</option>`
          )
          .join("")
      );

      if (studentData.status) {
        // 將狀態文字轉換為對應的 value
        let statusValue;
        switch (studentData.status) {
          case "上課":
            statusValue = "1";
            break;
          case "請假":
            statusValue = "2";
            break;
          case "曠課":
            statusValue = "3";
            break;
          case "停課":
            statusValue = "4";
            break;
          default:
            statusValue = ""; // 未知狀態，設置為空
        }

        // 設置 select 的值
        $("#st_status_attend").val(statusValue);
        console.log("匹配的狀態值:", statusValue);
      } else {
        // 如果沒有狀態，設置為預設值
        $("#st_status_attend").val("");
        console.log("無狀態資料，預設值為空");
      }

      $("#st_last_problem_attend").val(studentData.progress);
      $("#st_problems_attend").val(studentData.problems);
      $("#st_attend_id").val(studentData.attend_id);

      $("#editStudentAttendButton").click();
    });
  });
}
