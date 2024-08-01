"use strict";

// 初始化当前年份和月份
const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth();

// 初始化 FullCalendar
$("#myEvent").fullCalendar({
  height: 'auto',
  header: {
    left: 'prev,next today',
    center: 'title',
    right: 'filterButton'
  },
  customButtons: {
    filterButton: {
      text: 'Filter', // 设置占位文本
      click: function() {
        $('#filterModal').modal('show');
      }
    }
  },
  events: [
    {
      title: 'Conference',
      start: '2024-08-09',
      end: '2024-08-11',
      backgroundColor: "#fff",
      borderColor: "red",
      textColor: 'red'
    },
    {
      title: "John's Birthday",
      start: '2018-01-14',
      backgroundColor: "#007bff",
      borderColor: "#007bff",
      textColor: '#fff'
    },
    {
      title: 'Reporting',
      start: '2018-01-10T11:30:00',
      backgroundColor: "#f56954",
      borderColor: "#f56954",
      textColor: '#fff'
    },
    {
      title: 'Starting New Project',
      start: '2018-01-11',
      backgroundColor: "#ffc107",
      borderColor: "#ffc107",
      textColor: '#fff'
    },
    {
      title: 'Social Distortion Concert',
      start: '2018-01-24',
      end: '2018-01-27',
      backgroundColor: "#000",
      borderColor: "#000",
      textColor: '#fff'
    },
    {
      title: 'Lunch',
      start: '2018-01-24T13:15:00',
      backgroundColor: "#fff",
      borderColor: "#fff",
      textColor: '#000',
    },
    {
      title: 'Company Trip',
      start: '2018-01-28',
      end: '2018-01-31',
      backgroundColor: "#fff",
      borderColor: "#fff",
      textColor: '#000',
    },
  ]
});
$(document).ready(function() {
  // 手动修改按钮的 HTML
  $('.fc-filterButton-button').html("<div class='ion-android-options' data-pack='android' data-tags='settings, mixer'></div>");
});

// 填充年份选择框
for (let year = currentYear - 10; year <= currentYear + 10; year++) {
  $('#modalYearSelect').append(`<option value="${year}">${year}</option>`);
}
for (let month = 0; month < 12; month++) {
  $('#modalMonthSelect').append(`<option value="${month}">${month+1}月</option>`);
}

$('#modalYearSelect').val(currentYear);

// 设置当前月份
$('#modalMonthSelect').val(currentMonth);

// 应用筛选
$('#applyFilters').on('click', function() {
  const year = $('#modalYearSelect').val();
  const month = $('#modalMonthSelect').val();
  $('#myEvent').fullCalendar('gotoDate', `${year}-${String(parseInt(month) + 1).padStart(2, '0')}-01`);
  $('#filterModal').modal('hide');
});
