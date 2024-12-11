-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- 主機： 127.0.0.1
-- 產生時間： 2024-12-02 10:40:51
-- 伺服器版本： 10.4.32-MariaDB
-- PHP 版本： 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- 資料庫： `nncs`
--

-- --------------------------------------------------------

--
-- 資料表結構 `st_classtime`
--

CREATE TABLE `st_classtime` (
  `st_classtime_id` int(11) NOT NULL,
  `st_id` int(11) NOT NULL,
  `classtime_id` int(11) NOT NULL,
  `tr_id` int(11) DEFAULT NULL,
  `status` varchar(2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_general_ci;

--
-- 傾印資料表的資料 `st_classtime`
--

INSERT INTO `st_classtime` (`st_classtime_id`, `st_id`, `classtime_id`, `tr_id`, `status`) VALUES
(15, 1, 1, 1, '1'),
(16, 1, 2, 1, '1'),
(17, 4, 1, 2, '1'),
(18, 4, 5, 2, '1'),
(19, 5, 3, 2, '1'),
(20, 5, 4, 2, '1'),
(21, 6, 5, 8, '1'),
(22, 6, 6, 8, '1'),
(23, 7, 9, 8, '1'),
(24, 7, 10, 8, '1'),
(25, 9, 11, 8, '1'),
(26, 9, 12, 8, '1'),
(27, 10, 13, 2, '1'),
(29, 1, 45, 57, '1');

--
-- 已傾印資料表的索引
--

--
-- 資料表索引 `st_classtime`
--
ALTER TABLE `st_classtime`
  ADD PRIMARY KEY (`st_classtime_id`),
  ADD KEY `fk_students_st_classtime` (`st_id`),
  ADD KEY `fk_classtime_st_classtime` (`classtime_id`);

--
-- 在傾印的資料表使用自動遞增(AUTO_INCREMENT)
--

--
-- 使用資料表自動遞增(AUTO_INCREMENT) `st_classtime`
--
ALTER TABLE `st_classtime`
  MODIFY `st_classtime_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- 已傾印資料表的限制式
--

--
-- 資料表的限制式 `st_classtime`
--
ALTER TABLE `st_classtime`
  ADD CONSTRAINT `fk_classtime_st_classtime` FOREIGN KEY (`classtime_id`) REFERENCES `classtime` (`classtime_id`),
  ADD CONSTRAINT `fk_students_st_classtime` FOREIGN KEY (`st_id`) REFERENCES `students` (`st_id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
