"use strict";

const attendanceRecords = {};
document.getElementById("st_pay_date").valueAsDate = new Date();

renderRecords(st_data);
function renderRecords(data) {
  const tbody = document.getElementById("st_table_body");
  tbody.innerHTML = ""; // 清空表格內容
  if (data.length === 0) {
    return;
  }
  data.forEach((st) => {
    const row = document.createElement("tr");

    // 插入每一列資料
    row.innerHTML = `
            <td>${st.st_id}</td>
            <td>${st.st_name} <span class="fas fa-info-circle" data-id="${
      st.st_id
    }"></span></td>
            <td>${st.classroom}</td>
            <td>${
              "禮拜" + st.class_week + " " + st.start_time + "-" + st.end_time
            }</td>
            <td>${
              st.course_name && st.course_progress
                ? st.course_name + "-" + st.course_progress
                : "尚未有進度"
            }</td>
            <td>${st.status}</td>
            <td>
            ${
              st.class_status === ""
                ? `<button class="btn btn-primary attend-btn" data-id="${st.st_id}">上課</button>
                   <button class="btn btn-danger absent-btn" data-id="${st.st_id}">曠課</button>`
                : st.class_status
            }
              
            </td>`;

    tbody.appendChild(row);

    document.querySelectorAll(".fa-info-circle").forEach((span) => {
      span.addEventListener("click", function () {
        const studentId = this.getAttribute("data-id");
        const student = data.find((st) => st.st_id == studentId);
        $("#st_info_input_edit").val(student.st_id);
        $("#st_info_name").val(student.st_name);
        $("#st_info_age").val(student.st_age);
        if (student.course_name && student.course_progress) {
          $("#st_info_course_name").val(
            student.course_name + "-" + student.course_progress
          );
        } else {
          $("#st_info_course_name").val(""); // 如果沒有課程名稱或進度，則清空輸入框
        }
        $("#st_info_name").val(student.st_name);
        $("#st_info_phone1").val(student.st_phone1);
        $("#st_info_phone2").val(student.st_phone2);
        $("#st_info_note").val(student.st_note);
        $("#st_info_create_date").val(
          moment(student.st_create_date).format("YYYY-MM-DD")
        );
        $("#st_info_picture").attr("src", student.picture);
        const textarea = document.getElementById("st_info_note");
        $("#StudenInfoMessage").text("");

        textarea.addEventListener("input", function () {
          // 設置高度並強制使用 !important
          this.setAttribute(
            "style",
            `height: ${this.scrollHeight}px !important;`
          );
        });
        $("#st_info").click();
      });
    });

    if (st.class_status === "") {
      // 獲取上課和曠課按鈕
      const attendButton = row.querySelector(".attend-btn");
      const absentButton = row.querySelector(".absent-btn");
      attendanceRecords[st.st_id] = {
        classtime_id: st.classtime_id,
        status: "",
      };
      // "上課"按鈕點擊事件
      attendButton.addEventListener("click", function () {
        const studentId = attendButton.getAttribute("data-id");
        // 查找對應的曠課按鈕，並移除其 btn-danger 類
        const correspondingAbsentButton = document.querySelector(
          `button[data-id="${studentId}"].absent-btn`
        );
        correspondingAbsentButton.classList.remove("btn-danger"); // 去掉 "曠課" 按鈕的顏色
        correspondingAbsentButton.classList.add("btn-secondary");
        attendButton.classList.add("btn-primary");
        attendanceRecords[studentId] = {
          classtime_id: st.classtime_id,
          status: "1",
        };
      });

      // "曠課"按鈕點擊事件
      absentButton.addEventListener("click", function () {
        const studentId = absentButton.getAttribute("data-id");
        // 查找對應的上課按鈕，並去掉 btn-primary 類
        const correspondingAttendButton = document.querySelector(
          `button[data-id="${studentId}"].attend-btn`
        );
        correspondingAttendButton.classList.remove("btn-primary"); // 去掉 "上課" 按鈕的顏色
        correspondingAttendButton.classList.add("btn-secondary");

        // 給 "曠課" 按鈕加上 btn-secondary（變成灰色）
        absentButton.classList.add("btn-danger");
        attendanceRecords[studentId] = {
          classtime_id: st.classtime_id,
          status: "3",
        };
      });
    }
  });
}

document.getElementById("st_pay_date").addEventListener("change", function () {
  const selectedDate = this.value; // 獲取選擇的日期，格式為 "YYYY-MM-DD"

  // 使用 jQuery 發送 Ajax 請求到 Flask 後端
  $.ajax({
    type: "POST",
    headers: { "Content-Type": "application/json" },
    url: "/choose_st_schedule", // 假設後端路由是 '/get_student_data'
    data: JSON.stringify({
      selected_date: selectedDate,
      tr_id: tr_id, // 發送選定的日期
    }),
    success: function (response) {
      if (response != "查無資料") {
        classtimes = response["classtimes"];
        renderRecords(response["st_data"]); // 調用渲染學生資料的函數
      } else {
        renderRecords([]);
        classtimes = [];
      }
    },
  });
});

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("tr_rollcall").addEventListener("click", function () {
    $("#rollcall_date").val($("#st_pay_date").val());
    const optionsHTML = Object.entries(classtimes)
      .map(([key, c]) => `<option value="${key}">${c}</option>`)
      .join("");
    document.getElementById("rollcall_time").innerHTML = optionsHTML;
  });
});
