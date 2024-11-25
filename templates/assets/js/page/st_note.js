"use strict";

function populateTable(data) {
  const tableBody = document.getElementById("studentNoteTableBody");
  tableBody.innerHTML = ""; // 清空表格內容

  data.forEach((student) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${moment(student.class_date).format("YYYY-MM-DD")}</td>
            <td>${student.classroom_name}</td>
            <td>禮拜${student.class_week} ${student.start_time}-${
      student.end_time
    }</td>
            <td>${student.course_name}-${student.progress}</td>
            <td>${student.problems}</td>
        `;
    tableBody.appendChild(row);
  });
}

document.addEventListener("DOMContentLoaded", function () {
  populateTable(st_note);
});

document
  .getElementById("editNoteButton")
  .addEventListener("click", function () {
    $("#st_id").val(user_id);
      
    $("#StudenNoteMessage").text("");
  });
