"use strict";

const attendanceRecords = {};
document.getElementById("st_pay_date").valueAsDate = new Date();
// 繳費紀錄表格渲染函數
function renderPaymentRecords(data) {
  const tbody = document.getElementById("st_table_body");
  tbody.innerHTML = ""; // 清空表格內容

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
            <td>12345</td>
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
        console.log("Clicked span with ID:", studentId);
        $("#st_info").click();
      });
    });

    if (st.class_status === "") {
      // 获取上课和旷课按钮
      const attendButton = row.querySelector(".attend-btn");
      const absentButton = row.querySelector(".absent-btn");
      attendanceRecords[st.st_id] = {
        classtime_id: st.classtime_id,
        status: "",
      };
      // "上課"按鈕点击事件
      attendButton.addEventListener("click", function () {
        const studentId = attendButton.getAttribute("data-id");
        // 查找对应的曠課按钮，并移除其 btn-danger 类
        const correspondingAbsentButton = document.querySelector(
          `button[data-id="${studentId}"].absent-btn`
        );
        correspondingAbsentButton.classList.remove("btn-danger"); // 去掉 "曠課" 按钮的颜色
        correspondingAbsentButton.classList.add("btn-secondary");
        attendButton.classList.add("btn-primary");
        attendanceRecords[studentId] = {
          classtime_id: st.classtime_id,
          status: "1",
        };
      });

      // "曠課"按鈕点击事件
      absentButton.addEventListener("click", function () {
        const studentId = absentButton.getAttribute("data-id");
        // 查找对应的上課按钮，并去掉 btn-primary 类
        const correspondingAttendButton = document.querySelector(
          `button[data-id="${studentId}"].attend-btn`
        );
        correspondingAttendButton.classList.remove("btn-primary"); // 去掉 "上課" 按钮的颜色
        correspondingAttendButton.classList.add("btn-secondary");

        // 给 "曠課" 按钮加上 btn-secondary（变成灰色）
        absentButton.classList.add("btn-danger");
        attendanceRecords[studentId] = {
          classtime_id: st.classtime_id,
          status: "3",
        };
      });
    }
  });
}

// 初始化顯示繳費紀錄
renderPaymentRecords(st_data);
