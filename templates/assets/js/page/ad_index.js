"use strict";

function clearInput() {
  document.getElementById("searchInput").value = ""; // 清空輸入框
  populateTable(st_data); // 恢復顯示所有學生資料
}

// 監聽輸入框的 Enter 鍵
document
  .getElementById("searchInput")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      searchTable(); // 當按下 Enter 鍵時觸發搜尋
    }
  });

function populateTable(data) {
  const tableBody = document.getElementById("studentTableBody");
  tableBody.innerHTML = ""; // 清空表格內容

  data.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${student.st_id}</td>
            <td>${student.st_name}</td>
            <td>${student.st_parent}</td>
            <td>${student.st_phone1}</td>
            <td>${student.st_phone2}</td>
            <td style="width: 142px;">
                <a class="btn btn-primary btn-action mr-1 edit-btn" data-id="${student.st_id}"><i class="fas fa-pencil-alt"></i></a>
                <a class="btn btn-danger btn-action leave-btn" data-id="${student.st_id}"><i class="fas fa-share-square"></i></a>
            </td>
        `;
    tableBody.appendChild(row);
  });
  // 為每個編輯按鈕添加點擊事件
  document.querySelectorAll(".edit-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const studentId = this.getAttribute("data-id");
      const studentData = data.find((student) => student.st_id == studentId);
      $("#st_pwd_edit").hide();
      $("#st_id_edit").text(studentData.st_id);
      $("#st_acc_edit").val(studentData.st_acc);
      $("#st_pwd_reset").click(function () {
        $("#st_pwd_edit").show(); // Show the password reset field
      });
      $("#st_name_edit").val(studentData.st_name);
      $("#st_age_edit").val(studentData.st_age);
      $("#st_address_edit").val(studentData.st_address);
      $("#st_phone1_edit").val(studentData.st_phone1);
      $("#st_phone2_edit").val(studentData.st_phone2);
      $("#st_email_edit").val(studentData.st_email);
      $("#st_picture_edit").attr("src", studentData.st_picture);
      $("#st_create_date_edit").val(
        moment(studentData.st_create_date).format("YYYY-MM-DD")
      );
      $("#st_workplace_edit").val(studentData.st_workplace);
      $("#st_profession_edit").val(studentData.st_profession);
      $("#st_parent_edit").val(studentData.st_parent);
      $("#st_tuition_edit").val(studentData.st_tuition);
      $("#st_pay_num_edit").val(studentData.st_pay_num);
      const currentCourseId = studentData.st_course_id;
      const currentCourseName = course_name_data.find(
        (course) => course.course_id === currentCourseId
      )?.name;
      $("#st_course_name_edit").html(`
            <option value="" disabled>請選擇學習進度</option>
            ${course_name_data
              .map(
                (course) =>
                  `<option value="${course.course_id}" ${
                    course.course_id === currentCourseId ? "selected" : ""
                  }>${course.name}</option>`
              )
              .join("")}
          `);

      $("#st_note_edit").val(studentData.st_note);
      const textarea = document.getElementById("st_note_edit");

      textarea.addEventListener("input", function () {
        // 設置高度並強制使用 !important
        this.setAttribute(
          "style",
          `height: ${this.scrollHeight}px !important;`
        );
      });
      $("#editStudentButton").click();
    });
  });

  document.querySelectorAll(".leave-btn").forEach((button) => {
    button.addEventListener("click", function () {
      const studentId = this.getAttribute("data-id");
      const studentData = data.find((student) => student.st_id == studentId);
      $("#st_id_leave").text(studentData.st_id);
      $("#st_name_leave").text(studentData.st_name);
      $("#leaveStudentButton").click();
    });
  });
}

function searchTable() {
  const input = document.getElementById("searchInput").value.toLowerCase();
  const filteredData = st_data.filter((student) => {
    return (
      student.st_id.toString().includes(input) ||
      student.st_name.toLowerCase().includes(input) ||
      student.st_parent.toLowerCase().includes(input) ||
      student.st_phone1.includes(input) ||
      student.st_phone2.includes(input)
    );
  });
  populateTable(filteredData); // 更新表格
}

document.addEventListener("DOMContentLoaded", function () {
  populateTable(st_data);
});
