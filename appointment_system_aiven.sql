SET SESSION sql_require_primary_key = 0;
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 18, 2026 at 05:22 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `appointment_system`
--

-- --------------------------------------------------------

--
-- Table structure for table `admissions`
--

CREATE TABLE `admissions` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `patient_name` varchar(200) DEFAULT NULL,
  `contact_number` varchar(32) DEFAULT NULL,
  `admission_reason` varchar(255) NOT NULL,
  `pregnancy_cycle` varchar(50) DEFAULT NULL,
  `room` varchar(50) DEFAULT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'admitted',
  `admitted_at` datetime NOT NULL DEFAULT current_timestamp(),
  `delivered_at` datetime DEFAULT NULL,
  `delivery_type` varchar(50) DEFAULT NULL,
  `outcome` varchar(50) DEFAULT NULL,
  `baby_weight_kg` decimal(5,2) DEFAULT NULL,
  `apgar1` tinyint(4) DEFAULT NULL,
  `apgar5` tinyint(4) DEFAULT NULL,
  `complications` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `disposition` varchar(100) DEFAULT NULL,
  `discharge_notes` text DEFAULT NULL,
  `discharged_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admissions`
--

INSERT INTO `admissions` (`id`, `booking_id`, `user_id`, `patient_name`, `contact_number`, `admission_reason`, `pregnancy_cycle`, `room`, `status`, `admitted_at`, `delivered_at`, `delivery_type`, `outcome`, `baby_weight_kg`, `apgar1`, `apgar5`, `complications`, `notes`, `disposition`, `discharge_notes`, `discharged_at`, `created_at`, `updated_at`) VALUES
(7, NULL, NULL, 'jerome Blazo Lacson', '09362117373', 'g', NULL, '6', 'admitted', '2025-11-02 18:58:13', NULL, 'Cesarean Section', 'Stillbirth', 3.00, 3, 3, 'f', NULL, NULL, NULL, NULL, '2025-11-02 18:58:13', '2025-11-02 18:58:13'),
(8, NULL, NULL, 'jerome Blazo lacson', '09632117373', 'dsf', NULL, 'fd', 'admitted', '2025-11-02 20:19:38', NULL, 'Cesarean Section', 'Stillbirth', 23.00, 2, 2, 'g', NULL, NULL, NULL, NULL, '2025-11-02 20:19:38', '2025-11-02 20:19:38'),
(9, NULL, NULL, 'jerome Blazo Lacson', '09362117373', 'sd', NULL, 'sd', 'discharged', '2025-11-03 11:27:16', NULL, 'Normal Spontaneous Delivery', 'Live Birth', 23.00, 2, 2, 'd', NULL, NULL, NULL, NULL, '2025-11-03 11:27:16', '2025-11-03 11:27:16'),
(16, NULL, NULL, 'jerome Blazo Lacson', '09362117373', 'fg', NULL, '345', 'admitted', '2025-11-04 20:32:58', NULL, 'Normal Spontaneous Delivery', 'Live Birth', 44.98, 4, 4, 'gf', NULL, NULL, NULL, NULL, '2025-11-04 20:32:58', '2025-11-04 20:32:58'),
(17, NULL, 52, 'jerome Blazo lacson', '09632117373', 'sdf', NULL, '23', 'discharged', '2025-11-05 11:59:42', NULL, 'Cesarean Section', 'Ongoing Care', 3.00, 3, 3, 'sdfsd', NULL, NULL, 'dsf', '2025-11-21 19:48:48', '2025-11-05 11:59:42', '2025-11-21 19:48:48'),
(18, NULL, NULL, 'Deadpool wolf marvel', '09362117373', 'sdf', NULL, 'sdf', 'discharged', '2025-11-06 01:02:33', NULL, 'Normal Spontaneous Delivery', 'Stillbirth', 23.00, 2, 3, 'dsf', NULL, NULL, NULL, NULL, '2025-11-06 01:02:33', '2025-11-06 01:02:33'),
(19, NULL, NULL, 'jerome Blazo Lacson', '09362117373', 'sdfa', NULL, '23', 'discharged', '2025-11-06 09:48:13', NULL, 'Cesarean Section', 'Stillbirth', 2.00, 3, 2, 'sdf', NULL, NULL, NULL, NULL, '2025-11-06 09:48:13', '2025-11-06 09:48:13');

-- --------------------------------------------------------

--
-- Table structure for table `appointments`
--

CREATE TABLE `appointments` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `title` varchar(255) NOT NULL,
  `status` enum('available','booked','notavailable','holiday','ob available') DEFAULT 'available',
  `slots` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `appointments`
--

INSERT INTO `appointments` (`id`, `date`, `time`, `title`, `status`, `slots`) VALUES
(110, '2025-10-18', '00:00:00', 'Available', 'available', 0),
(112, '2025-10-24', '00:00:00', 'Available', 'available', 0),
(113, '2025-10-27', '00:00:00', 'Available', 'available', 0),
(114, '2025-10-28', '00:00:00', 'Holiday', 'holiday', 0),
(116, '2025-10-29', '00:00:00', 'Available', 'available', 0),
(215, '2025-11-29', '00:00:00', 'Available', 'available', 0),
(219, '2025-11-21', '00:00:00', 'Available', 'available', 0),
(225, '2025-11-25', '00:00:00', 'Available', 'available', 0),
(227, '2025-11-22', '00:00:00', 'Available', 'available', 0),
(228, '2025-11-27', '00:00:00', 'Available', 'available', 0),
(236, '2026-02-13', '00:00:00', 'Not Available', 'notavailable', 0),
(237, '2026-02-14', '00:00:00', 'Not Available', 'notavailable', 0),
(239, '2026-02-21', '00:00:00', 'Not Available', 'notavailable', 0),
(240, '2026-02-26', '00:00:00', 'OB Available', 'ob available', 0),
(241, '2026-02-27', '00:00:00', 'OB Available', 'ob available', 0),
(242, '2026-02-24', '00:00:00', 'OB Available', 'ob available', 0);

-- --------------------------------------------------------

--
-- Table structure for table `appointment_feedback`
--

CREATE TABLE `appointment_feedback` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `rating` tinyint(4) NOT NULL CHECK (`rating` between 1 and 5),
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `appointment_reminders`
--

CREATE TABLE `appointment_reminders` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `reminder_type` enum('sms','email','both') NOT NULL,
  `scheduled_time` datetime NOT NULL,
  `sent_time` datetime DEFAULT NULL,
  `status` enum('pending','sent','failed','cancelled') DEFAULT 'pending',
  `message` text DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `babies`
--

CREATE TABLE `babies` (
  `id` int(11) NOT NULL,
  `mother_patient_id` int(11) NOT NULL,
  `admission_id` int(11) DEFAULT NULL,
  `first_name` varchar(100) DEFAULT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) DEFAULT NULL,
  `birth_date` datetime NOT NULL,
  `birth_time` time DEFAULT NULL,
  `gender` enum('male','female') NOT NULL,
  `birth_weight_kg` decimal(4,2) DEFAULT NULL,
  `birth_length_cm` decimal(5,2) DEFAULT NULL,
  `head_circumference_cm` decimal(5,2) DEFAULT NULL,
  `apgar_1min` int(11) DEFAULT NULL,
  `apgar_5min` int(11) DEFAULT NULL,
  `blood_type` varchar(10) DEFAULT NULL,
  `complications` text DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `status` enum('active','discharged','transferred') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `babies`
--

INSERT INTO `babies` (`id`, `mother_patient_id`, `admission_id`, `first_name`, `middle_name`, `last_name`, `birth_date`, `birth_time`, `gender`, `birth_weight_kg`, `birth_length_cm`, `head_circumference_cm`, `apgar_1min`, `apgar_5min`, `blood_type`, `complications`, `photo`, `status`, `created_at`, `updated_at`) VALUES
(3, 30, NULL, 'gf', NULL, NULL, '2025-11-06 00:00:00', '15:55:00', 'male', 3.00, 43.00, 34.00, 4, NULL, NULL, 'fd', NULL, 'active', '2025-11-03 03:52:56', '2025-11-03 03:52:56'),
(4, 29, NULL, 'sdf', 'sd', 'sdf', '2025-11-13 00:00:00', '01:06:00', 'female', 23.00, 23.00, 23.00, 1, 2, 'A-', 'sdf', NULL, 'active', '2025-11-05 17:04:21', '2025-11-05 17:04:21'),
(5, 30, NULL, 'sadf', NULL, NULL, '2025-11-14 00:00:00', '09:46:00', 'male', 6.00, 30.00, 26.00, 2, NULL, NULL, 'sdfa', NULL, 'active', '2025-11-06 01:44:32', '2025-11-06 01:44:32'),
(6, 30, NULL, 'dfgs', NULL, NULL, '2025-11-14 00:00:00', '10:04:00', 'female', 2.00, 30.00, 25.00, 3, NULL, NULL, 'sdf', NULL, 'active', '2025-11-06 02:01:56', '2025-11-06 02:01:56'),
(7, 31, NULL, 'cxzv', NULL, NULL, '2025-11-20 00:00:00', '10:33:00', 'female', 2.00, 32.00, 32.00, 9, NULL, NULL, 'dsdsf', NULL, 'active', '2025-11-06 02:30:25', '2025-11-06 02:30:25'),
(8, 29, NULL, 'dsf', 'sadf', 'sdaf', '2025-11-18 00:00:00', '16:30:00', 'female', 23.00, 23.00, 23.00, 2, 2, 'A-', 'dsaffd', NULL, 'active', '2025-11-06 05:31:04', '2025-11-06 05:31:04');

-- --------------------------------------------------------

--
-- Table structure for table `baby_immunizations`
--

CREATE TABLE `baby_immunizations` (
  `id` int(11) NOT NULL,
  `baby_id` int(11) NOT NULL,
  `vaccine_name` varchar(100) NOT NULL,
  `scheduled_date` date NOT NULL,
  `administered_date` date DEFAULT NULL,
  `administered_by` int(11) DEFAULT NULL,
  `site` varchar(50) DEFAULT NULL,
  `lot_number` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `status` enum('scheduled','completed','missed','rescheduled') DEFAULT 'scheduled',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `baby_vitals`
--

CREATE TABLE `baby_vitals` (
  `id` int(11) NOT NULL,
  `baby_id` int(11) NOT NULL,
  `recorded_at` datetime NOT NULL,
  `weight_kg` decimal(4,2) DEFAULT NULL,
  `length_cm` decimal(5,2) DEFAULT NULL,
  `head_circumference_cm` decimal(5,2) DEFAULT NULL,
  `temperature` decimal(4,2) DEFAULT NULL,
  `heart_rate` int(11) DEFAULT NULL,
  `respiratory_rate` int(11) DEFAULT NULL,
  `oxygen_saturation` int(11) DEFAULT NULL,
  `feeding_type` enum('breastfeeding','formula','mixed') DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `recorded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `blood_pressure` varchar(50) DEFAULT NULL,
  `urine` varchar(100) DEFAULT NULL,
  `stool` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `birth_plans`
--

CREATE TABLE `birth_plans` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `partner_name` varchar(255) DEFAULT NULL,
  `partner_phone` varchar(50) DEFAULT NULL,
  `transport_mode` varchar(100) DEFAULT NULL,
  `donor_name` varchar(255) DEFAULT NULL,
  `donor_phone` varchar(50) DEFAULT NULL,
  `philhealth_status` varchar(100) DEFAULT NULL,
  `married` tinyint(1) DEFAULT NULL,
  `checklist_mother` text DEFAULT NULL,
  `checklist_baby` text DEFAULT NULL,
  `consent_signed` tinyint(1) DEFAULT NULL,
  `signed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `emergency_facility` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `birth_plans`
--

INSERT INTO `birth_plans` (`id`, `patient_id`, `partner_name`, `partner_phone`, `transport_mode`, `donor_name`, `donor_phone`, `philhealth_status`, `married`, `checklist_mother`, `checklist_baby`, `consent_signed`, `signed_at`, `created_at`, `emergency_facility`) VALUES
(1, 29, 'gg', '12345678911', 'dsf', 'sdf', 'sdf', 'sdf', 1, 'sdf', 'sdf', 0, '2025-11-20 10:53:00', '2025-11-19 18:51:40', NULL),
(2, 29, 'jerome', 'dsf', 'gg', 'sdf', 'sdfsd', '12', 1, 'dsf', 'sdaf', 0, '2025-11-20 19:54:00', '2025-11-21 03:54:46', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `booking`
--

CREATE TABLE `booking` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `patient_name` varchar(100) NOT NULL,
  `contact_number` varchar(20) NOT NULL,
  `service_type` varchar(100) NOT NULL,
  `date` date NOT NULL,
  `time_slot` varchar(20) NOT NULL,
  `request_status` enum('pending','confirmed','declined','cancelled') DEFAULT 'pending',
  `appointment_status` enum('ongoing','completed','cancelled','null') DEFAULT 'null',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `doctor_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `patient_notes` text DEFAULT NULL,
  `is_returning_patient` tinyint(1) DEFAULT 0,
  `visit_number` int(11) DEFAULT 1,
  `cancel_reason` enum('patient_request','schedule_conflict','not_feeling_well','emergency','other') DEFAULT NULL,
  `cancel_note` text DEFAULT NULL,
  `cancelled_by` enum('patient','admin','doctor','system') DEFAULT NULL,
  `cancelled_at` timestamp NULL DEFAULT NULL,
  `follow_up_of_booking_id` int(11) DEFAULT NULL,
  `follow_up_due_on` date DEFAULT NULL,
  `feedback_requested` tinyint(1) NOT NULL DEFAULT 0,
  `decline_reason` varchar(255) DEFAULT NULL,
  `decline_note` text DEFAULT NULL,
  `declined_by` varchar(50) DEFAULT NULL,
  `declined_at` timestamp NULL DEFAULT NULL,
  `checked_in_at` datetime DEFAULT NULL,
  `follow_up_provider_type` enum('doctor','midwife','obgyn') DEFAULT 'doctor' COMMENT 'Type of provider for follow-up appointment',
  `is_ob_booking` tinyint(1) DEFAULT 0,
  `ob_provider_type` varchar(20) DEFAULT NULL COMMENT 'doctor or midwife for OB bookings'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `booking`
--

INSERT INTO `booking` (`id`, `user_id`, `patient_name`, `contact_number`, `service_type`, `date`, `time_slot`, `request_status`, `appointment_status`, `created_at`, `doctor_id`, `notes`, `updated_at`, `patient_notes`, `is_returning_patient`, `visit_number`, `cancel_reason`, `cancel_note`, `cancelled_by`, `cancelled_at`, `follow_up_of_booking_id`, `follow_up_due_on`, `feedback_requested`, `decline_reason`, `decline_note`, `declined_by`, `declined_at`, `checked_in_at`, `follow_up_provider_type`, `is_ob_booking`, `ob_provider_type`) VALUES
(53, 52, 'jerome Blazo lacson', '09632117373', 'Family Planning and Reproductive Health', '2025-11-19', '00:00', 'declined', 'null', '2025-11-17 17:23:10', NULL, NULL, '2025-11-18 05:39:24', NULL, 0, 1, 'not_feeling_well', 'gg', 'patient', '2025-11-18 05:38:44', NULL, NULL, 0, NULL, NULL, 'admin', '2025-11-18 05:39:24', '2025-11-18 03:01:18', 'doctor', 0, NULL),
(54, 0, 'Deadpool wolf marvel', '09362117373', 'Diagnostic and Laboratory Services', '2025-11-17', '00:00', 'confirmed', 'null', '2025-11-17 19:01:10', NULL, NULL, NULL, NULL, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 'doctor', 0, NULL),
(55, 0, 'jerome Blazo Lacson', '09362117373', 'Diagnostic and Laboratory Services', '2025-11-17', '00:00', 'confirmed', 'null', '2025-11-18 06:53:32', NULL, NULL, NULL, NULL, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 'doctor', 0, NULL),
(57, 52, 'jerome Blazo lacson', '09632117373', 'labrat', '2025-11-28', '00:00', 'declined', 'null', '2025-11-19 18:11:13', NULL, NULL, '2025-11-22 01:21:03', NULL, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, 'admin', '2025-11-22 01:21:03', NULL, 'doctor', 0, NULL),
(64, 0, 'jesica soho ga', '09123456789', 'Prenatal', '2025-11-21', '00:00', 'confirmed', 'completed', '2025-11-22 03:31:07', NULL, NULL, '2025-11-22 03:31:52', NULL, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2025-11-22 11:31:25', 'doctor', 0, NULL),
(65, 0, 'jesica soho ga', '09123456789', 'Prenatal', '2025-11-21', '00:00', 'confirmed', 'completed', '2025-11-22 03:40:25', NULL, NULL, '2025-11-22 03:41:16', NULL, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, '2025-11-22 11:40:40', 'doctor', 0, NULL),
(66, 0, 'jesica soho ga', '09123456789', 'labrat', '2025-11-21', '00:00', 'confirmed', 'completed', '2025-11-22 03:45:06', NULL, NULL, '2025-11-22 03:45:40', NULL, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 'doctor', 0, NULL),
(67, 0, 'jesica soho ga', '09123456789', 'Prenatal', '2025-11-21', '00:00', 'confirmed', 'completed', '2025-11-22 03:49:39', NULL, NULL, '2025-11-22 03:59:05', NULL, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 'doctor', 0, NULL),
(68, 0, 'jesica soho ga', '09123456789', 'Prenatal', '2025-11-21', '00:00', 'confirmed', 'completed', '2025-11-22 04:29:36', NULL, NULL, '2025-11-22 04:30:17', NULL, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 'doctor', 0, NULL),
(69, 0, 'jesica soho ga', '09123456789', 'Prenatal Checkup', '2025-11-29', '8:00-8:30AM', 'confirmed', 'ongoing', '2025-11-22 04:30:17', NULL, NULL, NULL, NULL, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 'doctor', 0, NULL),
(70, 0, 'jerome Blazo Lacson', '09362117373', 'labrat', '2026-02-24', 'Slot 1', 'confirmed', 'ongoing', '2026-02-18 14:18:49', NULL, NULL, '2026-02-18 14:21:15', NULL, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 'doctor', 1, NULL),
(71, 0, 'jesica soho ga', '09123456789', 'Newborn Care', '2026-02-27', 'Slot 1', 'confirmed', 'ongoing', '2026-02-18 15:12:10', NULL, NULL, NULL, NULL, 0, 1, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, 'doctor', 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `doctors`
--

CREATE TABLE `doctors` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `specialization` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `schedule` varchar(100) NOT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `doctors`
--

INSERT INTO `doctors` (`id`, `name`, `specialization`, `email`, `phone`, `schedule`, `status`, `created_at`) VALUES
(14, 'jobielyn', 'maternity', 'lacsonjobielyn@gmail.com', '09632117374', 'monday', 'active', '2025-10-12 06:02:31');

-- --------------------------------------------------------

--
-- Table structure for table `family_planning`
--

CREATE TABLE `family_planning` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `consultation_date` date NOT NULL,
  `method_chosen` varchar(100) DEFAULT NULL,
  `method_started_date` date DEFAULT NULL,
  `method_category` enum('natural','barrier','hormonal','iud','permanent','none') DEFAULT NULL,
  `counseling_done` tinyint(1) DEFAULT 0,
  `side_effects` text DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `discontinued_date` date DEFAULT NULL,
  `discontinuation_reason` text DEFAULT NULL,
  `status` enum('active','discontinued','completed') DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `counseled_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `family_planning`
--

INSERT INTO `family_planning` (`id`, `patient_id`, `consultation_date`, `method_chosen`, `method_started_date`, `method_category`, `counseling_done`, `side_effects`, `follow_up_date`, `discontinued_date`, `discontinuation_reason`, `status`, `notes`, `counseled_by`, `created_at`, `updated_at`) VALUES
(3, 30, '2025-11-07', 'Injectable (DMPA)', NULL, NULL, 1, '1', '2025-11-07', NULL, NULL, 'active', 'hfg', NULL, '2025-11-04 00:46:33', '2025-11-04 00:46:33'),
(16, 29, '2024-01-15', 'Pills', NULL, 'hormonal', NULL, NULL, NULL, NULL, NULL, 'active', NULL, NULL, '2025-11-05 03:44:21', '2025-11-05 03:44:21'),
(19, 31, '2025-11-06', 'asda', '2025-11-20', 'hormonal', 0, 'sdfsd', '2025-11-20', NULL, NULL, 'active', 'sdf', NULL, '2025-11-05 03:58:59', '2025-11-05 03:58:59'),
(25, 29, '2025-11-14', 'dfsd', '2025-11-21', 'hormonal', 1, 'sdf', '2025-11-14', NULL, NULL, 'active', 'sdf', NULL, '2025-11-05 15:09:13', '2025-11-05 15:09:13'),
(26, 31, '2025-11-05', 'sd', '2025-11-13', 'permanent', 0, 'sd', '2025-11-26', NULL, NULL, 'active', 'sd', NULL, '2025-11-05 16:57:13', '2025-11-05 16:57:13'),
(27, 31, '2025-11-11', 'fgh', '2025-11-14', 'hormonal', 0, 'fgh', '2025-11-18', NULL, NULL, 'active', 'fgh', NULL, '2025-11-06 01:11:10', '2025-11-06 01:11:10'),
(28, 30, '2025-11-18', 'dsfa', '2025-11-13', '', 1, 'sdaf', '2025-11-19', NULL, NULL, 'active', 'safd', NULL, '2025-11-06 01:42:17', '2025-11-06 01:42:17');

-- --------------------------------------------------------

--
-- Table structure for table `immunizations`
--

CREATE TABLE `immunizations` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `patient_name` varchar(255) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `vaccine_type` varchar(100) NOT NULL,
  `date_given` date NOT NULL,
  `dose_number` varchar(20) DEFAULT NULL,
  `injection_site` varchar(100) DEFAULT NULL,
  `healthcare_provider` varchar(100) DEFAULT NULL,
  `batch_number` varchar(50) DEFAULT NULL,
  `manufacturer` varchar(100) DEFAULT NULL,
  `next_due_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `adverse_reactions` text DEFAULT NULL,
  `patient_type` enum('registered','walk_in') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `immunizations`
--

INSERT INTO `immunizations` (`id`, `patient_id`, `patient_name`, `contact_number`, `vaccine_type`, `date_given`, `dose_number`, `injection_site`, `healthcare_provider`, `batch_number`, `manufacturer`, `next_due_date`, `notes`, `adverse_reactions`, `patient_type`, `created_at`, `updated_at`) VALUES
(1, 29, 'jerome Blazo lacson', '09632117373', 'BCG Vaccine', '2025-11-13', '7', 'Left Thigh', 'sdf', '2', 'sdf', '2025-11-12', 'sdf', 'sdf', 'registered', '2025-11-05 17:21:19', '2025-11-05 17:21:19'),
(2, NULL, 'jerome Blazo Lacson', '09362117373', 'DPT', '2025-11-25', 'sdfa', 'Right Arm', 'sdaf', '3', 'sadf', '2025-11-10', 'sdaf', 'sadf', 'registered', '2025-11-06 01:47:20', '2025-11-06 01:47:20'),
(3, NULL, 'jerome Blazo Lacson', '09362117373', 'DPT', '2025-11-20', '3', 'Right Arm', 'gfd', '34', 'fdg', '2025-11-12', 'fdg', 'dfg', 'registered', '2025-11-06 02:00:49', '2025-11-06 02:00:49'),
(4, NULL, 'Deadpool wolf marvel', '09362117373', 'Polio', '2025-11-18', '23', 'Right Arm', 'sadf', 'sdfa', 'asdf', '2025-11-27', 'sdaf', 'sdaf', 'registered', '2025-11-06 02:31:57', '2025-11-06 02:31:57'),
(5, 29, 'jerome Blazo lacson', '09632117373', 'Hepatitis B', '2025-11-27', '23', 'Right Arm', 'dsf', '23', '23', '0000-00-00', 'sdf', 'sdf', 'registered', '2025-11-21 05:12:30', '2025-11-21 05:12:30');

-- --------------------------------------------------------

--
-- Table structure for table `lab_results`
--

CREATE TABLE `lab_results` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `booking_id` int(11) DEFAULT NULL,
  `test_type` varchar(100) NOT NULL,
  `test_category` enum('blood','urine','cervical_screening','pregnancy','ultrasound','imaging','screening','cbc','blood_typing','vdrl','hepa_b','other') NOT NULL,
  `test_date` date NOT NULL,
  `result_value` text DEFAULT NULL,
  `normal_range` varchar(100) DEFAULT NULL,
  `reference_range` varchar(100) DEFAULT NULL,
  `unit` varchar(50) DEFAULT NULL,
  `status` enum('pending','completed','abnormal','critical') DEFAULT 'pending',
  `interpretation` text DEFAULT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `ordered_by` int(11) DEFAULT NULL,
  `performed_by` varchar(100) DEFAULT NULL,
  `lab_name` varchar(100) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `lab_results`
--

INSERT INTO `lab_results` (`id`, `patient_id`, `booking_id`, `test_type`, `test_category`, `test_date`, `result_value`, `normal_range`, `reference_range`, `unit`, `status`, `interpretation`, `file_path`, `ordered_by`, `performed_by`, `lab_name`, `reviewed_by`, `notes`, `created_at`, `updated_at`) VALUES
(1, 29, NULL, 'df', 'imaging', '2025-11-03', 'ds', 'ds', NULL, 'ds', 'abnormal', 'ds', NULL, NULL, NULL, NULL, NULL, 'sd', '2025-11-03 04:59:14', '2025-11-03 04:59:14'),
(2, 30, NULL, 'Colposcopy', 'cervical_screening', '2025-11-21', '120', NULL, '23', 'dsf', 'abnormal', NULL, NULL, NULL, NULL, 'sdf', NULL, 'sdf', '2025-11-06 03:04:05', '2025-11-06 03:04:05'),
(3, 31, NULL, 'xvbc', 'imaging', '2025-11-14', 'xcv', NULL, 'cxv', 'cxv', 'abnormal', NULL, NULL, NULL, NULL, 'cxv', NULL, 'zxc', '2025-11-06 03:18:27', '2025-11-06 03:18:27'),
(4, 30, NULL, 'HPV Test', 'cervical_screening', '2025-11-22', 'fdgsd', NULL, 'sdaf', 'sadf', 'completed', NULL, NULL, NULL, NULL, 'sadf', NULL, 'sadf', '2025-11-22 03:24:21', '2025-11-22 03:24:21'),
(5, 33, NULL, 'Colposcopy', 'cervical_screening', '2025-11-22', 'sadf', NULL, 'asdf', 'sadf', 'abnormal', NULL, NULL, NULL, NULL, 'asdf', NULL, 'sadf', '2025-11-22 03:25:13', '2025-11-22 03:25:13');

-- --------------------------------------------------------

--
-- Table structure for table `medical_certificates`
--

CREATE TABLE `medical_certificates` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `certificate_type` enum('sick_leave','fit_to_work','pregnancy','birth_certificate_support','medical_clearance') NOT NULL,
  `issue_date` date NOT NULL,
  `valid_from` date DEFAULT NULL,
  `valid_to` date DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `purpose` varchar(255) DEFAULT NULL,
  `issued_by` int(11) NOT NULL,
  `file_path` varchar(255) DEFAULT NULL,
  `certificate_number` varchar(50) DEFAULT NULL,
  `status` enum('active','void','expired') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `medical_notes`
--

CREATE TABLE `medical_notes` (
  `id` int(11) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `doctor_notes` text DEFAULT NULL,
  `diagnosis` varchar(500) DEFAULT NULL,
  `treatment_given` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `next_appointment_suggestion` varchar(255) DEFAULT NULL,
  `vital_signs` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`vital_signs`)),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medical_notes`
--

INSERT INTO `medical_notes` (`id`, `booking_id`, `patient_id`, `doctor_notes`, `diagnosis`, `treatment_given`, `recommendations`, `next_appointment_suggestion`, `vital_signs`, `created_at`, `updated_at`) VALUES
(20, 64, 34, 'Prenatal Findings: sadf\nRisk Assessment: sdf\nEducation Provided: sdfsa', NULL, NULL, NULL, NULL, '{\"blood_pressure\":\"12\",\"heart_rate\":\"23\",\"temperature\":\"32\",\"weight\":\"343\",\"height\":\"23\",\"lmp\":\"23\",\"edd\":\"23\",\"gravida\":\"23\",\"para\":\"23\",\"gestational_age\":\"23sdaf\",\"fetal_heart_rate\":\"23\",\"fundal_height\":\"23\",\"fetal_movement\":\"sdafs\",\"respiratory_rate\":\"23\",\"urine\":\"sdfsdfa\",\"stool\":\"gdsa\",\"recorded_at\":\"2025-11-22T03:31:11.557Z\",\"recorded_by\":\"jeromelacson2024\"}', '2025-11-22 03:31:23', '2025-11-22 03:31:52'),
(21, 65, 34, 'Prenatal Findings: sdaf\nRisk Assessment: sdfsda\nEducation Provided: sdfsdfs', NULL, NULL, NULL, NULL, '{\"blood_pressure\":\"324\",\"heart_rate\":\"23\",\"temperature\":\"34\",\"weight\":\"23\",\"height\":\"23\",\"lmp\":\"234\",\"edd\":\"sdf\",\"gravida\":\"sdf\",\"para\":\"sdf\",\"gestational_age\":\"234\",\"fetal_heart_rate\":\"23\",\"fundal_height\":\"234\",\"fetal_movement\":\"sf\",\"respiratory_rate\":\"23\",\"urine\":\"dsafd\",\"stool\":\"sadfsd\",\"recorded_at\":\"2025-11-22T03:40:29.403Z\",\"recorded_by\":\"jeromelacson2024\"}', '2025-11-22 03:40:37', '2025-11-22 03:41:16');

-- --------------------------------------------------------

--
-- Table structure for table `medication_administration`
--

CREATE TABLE `medication_administration` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `admission_id` int(11) DEFAULT NULL,
  `administration_date` date NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medication_administration`
--

INSERT INTO `medication_administration` (`id`, `patient_id`, `admission_id`, `administration_date`, `created_by`, `notes`, `created_at`) VALUES
(1, 29, 17, '2025-11-20', 44, NULL, '2025-11-20 08:59:17');

-- --------------------------------------------------------

--
-- Table structure for table `medication_admin_entries`
--

CREATE TABLE `medication_admin_entries` (
  `id` int(11) NOT NULL,
  `administration_id` int(11) NOT NULL,
  `time_administered` time DEFAULT NULL,
  `medication_name` varchar(255) NOT NULL,
  `dose` varchar(100) DEFAULT NULL,
  `route` varchar(50) DEFAULT NULL,
  `administered_by` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `medication_admin_entries`
--

INSERT INTO `medication_admin_entries` (`id`, `administration_id`, `time_administered`, `medication_name`, `dose`, `route`, `administered_by`, `notes`, `created_at`) VALUES
(1, 1, '06:59:00', 'sdf', '2', '23', 'dsf', 'asd', '2025-11-20 08:59:17');

-- --------------------------------------------------------

--
-- Table structure for table `newborn_admissions`
--

CREATE TABLE `newborn_admissions` (
  `id` int(11) NOT NULL,
  `baby_id` int(11) NOT NULL,
  `status` enum('admitted','discharged') DEFAULT 'admitted',
  `date_admitted` datetime DEFAULT NULL,
  `admitting_diagnosis` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `date_discharge` datetime DEFAULT NULL,
  `home_medication` text DEFAULT NULL,
  `follow_up` text DEFAULT NULL,
  `screening_date` datetime DEFAULT NULL,
  `screening_filter_card_no` varchar(100) DEFAULT NULL,
  `vitamin_k_date` date DEFAULT NULL,
  `bcg_date` date DEFAULT NULL,
  `hepb_date` date DEFAULT NULL,
  `discharged_by` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `newborn_admissions`
--

INSERT INTO `newborn_admissions` (`id`, `baby_id`, `status`, `date_admitted`, `admitting_diagnosis`, `notes`, `date_discharge`, `home_medication`, `follow_up`, `screening_date`, `screening_filter_card_no`, `vitamin_k_date`, `bcg_date`, `hepb_date`, `discharged_by`, `created_at`) VALUES
(1, 4, 'admitted', '2025-11-20 06:45:28', 'Full term baby via NSD', 'gg', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-20 06:45:33'),
(2, 4, 'admitted', '2025-11-28 13:41:17', 'Full term babsdffsdy via NSD', 'sdf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, '2025-11-21 13:41:24');

-- --------------------------------------------------------

--
-- Table structure for table `password_resets`
--

CREATE TABLE `password_resets` (
  `id` int(11) NOT NULL,
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `used` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `patients`
--

CREATE TABLE `patients` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) NOT NULL,
  `age` int(3) DEFAULT NULL,
  `gender` enum('male','female','other') NOT NULL,
  `address` text DEFAULT NULL,
  `photo` varchar(255) DEFAULT NULL,
  `emergency_contact_name` varchar(100) DEFAULT NULL,
  `emergency_contact_phone` varchar(20) DEFAULT NULL,
  `emergency_contact_relationship` varchar(50) DEFAULT NULL,
  `allergies` text DEFAULT NULL,
  `blood_type` varchar(10) DEFAULT NULL,
  `is_high_risk` tinyint(1) DEFAULT 0,
  `lmp` date DEFAULT NULL,
  `edd` date DEFAULT NULL,
  `gravida` int(11) DEFAULT NULL,
  `para` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `medical_history` text DEFAULT NULL,
  `last_visit` date DEFAULT NULL,
  `total_visits` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `profile_picture` varchar(255) DEFAULT NULL,
  `first_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `last_name` varchar(100) NOT NULL,
  `consultation_completed` tinyint(1) DEFAULT 0,
  `first_consultation_date` datetime DEFAULT NULL,
  `partner_name` varchar(255) DEFAULT NULL,
  `partner_age` varchar(50) DEFAULT NULL,
  `partner_occupation` varchar(100) DEFAULT NULL,
  `partner_religion` varchar(100) DEFAULT NULL,
  `religion` varchar(50) DEFAULT NULL,
  `occupation` varchar(100) DEFAULT NULL,
  `place_of_birth` varchar(100) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `marital_status` varchar(50) DEFAULT NULL,
  `nationality` varchar(100) DEFAULT NULL,
  `ethnicity` varchar(100) DEFAULT NULL,
  `preferred_language` varchar(100) DEFAULT NULL,
  `last_menstrual_period` date DEFAULT NULL COMMENT 'Last Menstrual Period date for prenatal tracking',
  `expected_delivery_date` date DEFAULT NULL COMMENT 'Expected Delivery Date (EDD) for pregnant patients'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `patients`
--

INSERT INTO `patients` (`id`, `user_id`, `email`, `phone`, `age`, `gender`, `address`, `photo`, `emergency_contact_name`, `emergency_contact_phone`, `emergency_contact_relationship`, `allergies`, `blood_type`, `is_high_risk`, `lmp`, `edd`, `gravida`, `para`, `notes`, `medical_history`, `last_visit`, `total_visits`, `created_at`, `updated_at`, `profile_picture`, `first_name`, `middle_name`, `last_name`, `consultation_completed`, `first_consultation_date`, `partner_name`, `partner_age`, `partner_occupation`, `partner_religion`, `religion`, `occupation`, `place_of_birth`, `date_of_birth`, `marital_status`, `nationality`, `ethnicity`, `preferred_language`, `last_menstrual_period`, `expected_delivery_date`) VALUES
(29, 52, 'jeromelacson2020@gmail.com', '09632117373', 21, 'female', 'pulido', NULL, '', '', '', '', 'A-', 0, NULL, NULL, NULL, NULL, '', NULL, NULL, 0, '2025-11-01 09:11:56', '2025-11-18 02:39:40', NULL, 'jerome', 'Blazo', 'lacson', 1, '2025-11-02 00:00:00', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(30, NULL, 'je@gmail.com', '09362117373', 21, 'female', 'gg', NULL, '', '', '', '', '', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2025-11-01 09:17:40', '2025-11-01 11:31:50', NULL, 'jerome', 'Blazo', 'Lacson', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(31, NULL, '', '09362117373', NULL, 'male', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2025-11-03 17:21:01', NULL, NULL, 'Deadpool', 'wolf', 'marvel', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(32, NULL, '', '09123456789', NULL, 'male', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2025-11-22 02:08:27', NULL, NULL, 'jUggernt', 'deadpool', 'Blake', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(33, NULL, '', '09123456789', NULL, 'male', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2025-11-22 02:19:43', NULL, NULL, 'Test', NULL, 'Walkin', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(34, NULL, 'walkin_09123456789@placeholder.local', '09123456789', NULL, '', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 0, '2025-11-22 03:31:07', NULL, NULL, 'jesica', 'soho', 'ga', 0, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `patient_merge_history`
--

CREATE TABLE `patient_merge_history` (
  `id` int(11) NOT NULL,
  `registered_patient_id` int(11) NOT NULL,
  `walk_in_name` varchar(255) NOT NULL,
  `walk_in_contact` varchar(20) NOT NULL,
  `merged_bookings_count` int(11) DEFAULT 0,
  `merged_by` int(11) DEFAULT NULL,
  `merged_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `postpartum_care`
--

CREATE TABLE `postpartum_care` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `admission_id` int(11) DEFAULT NULL,
  `day_postpartum` int(11) NOT NULL,
  `assessment_date` date NOT NULL,
  `blood_pressure` varchar(20) DEFAULT NULL,
  `temperature` decimal(4,2) DEFAULT NULL,
  `pulse` int(11) DEFAULT NULL,
  `fundal_height` varchar(50) DEFAULT NULL,
  `lochia_type` enum('rubra','serosa','alba') DEFAULT NULL,
  `lochia_amount` enum('scanty','light','moderate','heavy') DEFAULT NULL,
  `perineum_condition` enum('intact','healing','inflamed','infected') DEFAULT NULL,
  `breasts_condition` enum('soft','filling','engorged','mastitis') DEFAULT NULL,
  `breastfeeding_status` enum('exclusive','mixed','not_breastfeeding') DEFAULT NULL,
  `mood_assessment` enum('normal','anxious','depressed') DEFAULT NULL,
  `voiding_normal` tinyint(1) DEFAULT NULL,
  `bowel_movement_normal` tinyint(1) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `assessed_by` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `next_visit_date` date DEFAULT NULL,
  `iron_supplement_date` date DEFAULT NULL,
  `vitamin_a_date` date DEFAULT NULL,
  `deworming_date` date DEFAULT NULL,
  `tt_booster_date` date DEFAULT NULL,
  `foul_smell_discharge` tinyint(1) DEFAULT 0,
  `family_planning_method` varchar(100) DEFAULT NULL,
  `fever` tinyint(1) DEFAULT 0,
  `vaginal_bleeding` tinyint(1) DEFAULT 0,
  `booking_id` int(11) DEFAULT NULL,
  `assessment_notes` text DEFAULT NULL,
  `recovery_status` varchar(100) DEFAULT NULL,
  `follow_up_plan` text DEFAULT NULL,
  `pregnancy_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `postpartum_care`
--

INSERT INTO `postpartum_care` (`id`, `patient_id`, `admission_id`, `day_postpartum`, `assessment_date`, `blood_pressure`, `temperature`, `pulse`, `fundal_height`, `lochia_type`, `lochia_amount`, `perineum_condition`, `breasts_condition`, `breastfeeding_status`, `mood_assessment`, `voiding_normal`, `bowel_movement_normal`, `notes`, `assessed_by`, `created_at`, `next_visit_date`, `iron_supplement_date`, `vitamin_a_date`, `deworming_date`, `tt_booster_date`, `foul_smell_discharge`, `family_planning_method`, `fever`, `vaginal_bleeding`, `booking_id`, `assessment_notes`, `recovery_status`, `follow_up_plan`, `pregnancy_id`) VALUES
(1, 30, NULL, 43, '2025-11-03', '34', 34.00, NULL, '', '', NULL, '', NULL, '', '', NULL, NULL, 'fd', NULL, '2025-11-03 03:51:50', NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(3, 30, NULL, 1, '2025-11-03', '32', 23.00, 23, '', '', '', '', '', '', '', NULL, NULL, 'dsf', NULL, '2025-11-03 18:53:51', NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(6, 30, NULL, 23, '2025-11-20', '150', 23.00, NULL, '', '', NULL, '', NULL, '', '', NULL, NULL, 'sdfa', NULL, '2025-11-06 01:47:50', NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(7, 30, NULL, 23, '2025-11-22', '120', 3.00, NULL, '', '', NULL, '', NULL, '', '', NULL, NULL, 'dsf', NULL, '2025-11-06 02:03:29', NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(8, 31, NULL, 23, '2025-12-05', '120', 32.00, NULL, '', '', NULL, '', NULL, '', 'normal', NULL, NULL, 'sdaf', NULL, '2025-11-06 02:32:20', NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL),
(9, 30, NULL, 23, '2025-11-15', '120', 22.80, NULL, '', '', NULL, '', NULL, '', '', NULL, NULL, 'sdf', NULL, '2025-11-06 03:04:46', NULL, NULL, NULL, NULL, NULL, 0, NULL, 0, 0, NULL, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `prenatal_schedule`
--

CREATE TABLE `prenatal_schedule` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `pregnancy_id` int(11) DEFAULT NULL,
  `visit_number` int(11) NOT NULL,
  `trimester` int(11) NOT NULL,
  `scheduled_date` date NOT NULL,
  `completed_date` date DEFAULT NULL,
  `gestational_age` varchar(20) DEFAULT NULL,
  `fundal_height_cm` decimal(4,1) DEFAULT NULL,
  `fetal_heart_rate` int(11) DEFAULT NULL,
  `blood_pressure` varchar(20) DEFAULT NULL,
  `weight_kg` decimal(5,2) DEFAULT NULL,
  `edema` enum('none','mild','moderate','severe') DEFAULT NULL,
  `complaints` text DEFAULT NULL,
  `assessment` text DEFAULT NULL,
  `plan` text DEFAULT NULL,
  `next_visit_date` date DEFAULT NULL,
  `status` enum('scheduled','completed','missed','cancelled') DEFAULT 'scheduled',
  `attended` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `temperature_c` decimal(4,1) DEFAULT NULL,
  `maternal_heart_rate` int(11) DEFAULT NULL,
  `respiratory_rate` int(11) DEFAULT NULL,
  `visit_notes` text DEFAULT NULL,
  `visit_date` date DEFAULT NULL,
  `booking_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `prenatal_schedule`
--

INSERT INTO `prenatal_schedule` (`id`, `patient_id`, `pregnancy_id`, `visit_number`, `trimester`, `scheduled_date`, `completed_date`, `gestational_age`, `fundal_height_cm`, `fetal_heart_rate`, `blood_pressure`, `weight_kg`, `edema`, `complaints`, `assessment`, `plan`, `next_visit_date`, `status`, `attended`, `created_at`, `updated_at`, `temperature_c`, `maternal_heart_rate`, `respiratory_rate`, `visit_notes`, `visit_date`, `booking_id`) VALUES
(1, 29, NULL, 2, 2, '2025-11-14', NULL, '23', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'scheduled', 0, '2025-11-05 17:03:53', '2025-11-05 17:03:53', NULL, NULL, NULL, NULL, NULL, NULL),
(3, 29, 1, 2, 1, '2025-11-28', NULL, 'dsf', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'scheduled', 0, '2025-11-21 10:49:23', '2025-11-21 10:49:23', NULL, NULL, NULL, NULL, NULL, NULL),
(4, 29, 1, 2, 2, '2025-11-25', NULL, '323', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'scheduled', 0, '2025-11-21 10:49:42', '2025-11-21 10:49:42', NULL, NULL, NULL, NULL, NULL, NULL),
(5, 34, 1, 1, 1, '2025-11-22', NULL, '2', NULL, 34, '345', 345.00, NULL, NULL, 'dsfg', NULL, NULL, 'completed', 1, '2025-11-22 03:59:05', '2025-11-22 03:59:05', NULL, 345, NULL, NULL, NULL, NULL),
(6, 34, 1, 2, 3, '2025-11-22', NULL, '32', NULL, 3, 'sdaf', 0.00, NULL, NULL, 'sdaf', NULL, NULL, 'completed', 1, '2025-11-22 04:30:16', '2025-11-22 04:30:16', NULL, 0, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `procedures`
--

CREATE TABLE `procedures` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `patient_name` varchar(255) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `procedure_name` varchar(150) NOT NULL,
  `procedure_category` varchar(100) DEFAULT NULL,
  `procedure_date` date NOT NULL,
  `procedure_time` time DEFAULT NULL,
  `duration_minutes` int(11) DEFAULT NULL,
  `anesthesia_type` varchar(100) DEFAULT NULL,
  `surgeon` varchar(100) DEFAULT NULL,
  `assistant` varchar(100) DEFAULT NULL,
  `location` varchar(100) DEFAULT NULL,
  `indication` text DEFAULT NULL,
  `description` text DEFAULT NULL,
  `complications` text DEFAULT NULL,
  `outcome` varchar(255) DEFAULT NULL,
  `post_op_instructions` text DEFAULT NULL,
  `follow_up_required` tinyint(1) DEFAULT 0,
  `follow_up_date` date DEFAULT NULL,
  `status` enum('scheduled','in_progress','completed','cancelled','postponed') DEFAULT 'scheduled',
  `priority` enum('routine','urgent','emergency') DEFAULT 'routine',
  `cost` decimal(10,2) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `procedures`
--

INSERT INTO `procedures` (`id`, `patient_id`, `patient_name`, `contact_number`, `procedure_name`, `procedure_category`, `procedure_date`, `procedure_time`, `duration_minutes`, `anesthesia_type`, `surgeon`, `assistant`, `location`, `indication`, `description`, `complications`, `outcome`, `post_op_instructions`, `follow_up_required`, `follow_up_date`, `status`, `priority`, `cost`, `notes`, `created_at`, `updated_at`) VALUES
(1, 29, 'jerome Blazo lacson', '09632117373', 'Contraceptive Implant', NULL, '2025-11-12', NULL, 32, 'Local', NULL, NULL, 'das', NULL, NULL, 'sdf', 'sdf', NULL, 0, '0000-00-00', 'in_progress', 'routine', 12.00, 'sdf', '2025-11-05 17:31:46', '2025-11-05 17:31:46'),
(3, NULL, 'Deadpool wolf marvel', '09362117373', 'Contraceptive Implant', NULL, '2025-11-18', NULL, NULL, 'Local', 'sdaf', NULL, 'sdaf', NULL, NULL, 'sadf', 'sadf', NULL, 0, NULL, 'completed', 'routine', NULL, 'sdaf', '2025-11-22 03:19:13', '2025-11-22 03:19:13');

-- --------------------------------------------------------

--
-- Table structure for table `referrals`
--

CREATE TABLE `referrals` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) NOT NULL,
  `referral_to` varchar(255) NOT NULL,
  `referral_reason` varchar(255) DEFAULT NULL,
  `transport_mode` varchar(100) DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `treatment_given` text DEFAULT NULL,
  `referred_by` varchar(255) DEFAULT NULL,
  `referral_datetime` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `referral_returns`
--

CREATE TABLE `referral_returns` (
  `id` int(11) NOT NULL,
  `referral_id` int(11) NOT NULL,
  `return_to` varchar(255) DEFAULT NULL,
  `return_datetime` datetime DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `actions_taken` text DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `signed_by` varchar(255) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `screenings`
--

CREATE TABLE `screenings` (
  `id` int(11) NOT NULL,
  `patient_id` int(11) DEFAULT NULL,
  `patient_name` varchar(255) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `screening_type` varchar(100) NOT NULL,
  `screening_date` date NOT NULL,
  `gestational_age` varchar(20) DEFAULT NULL,
  `birth_weight_kg` decimal(4,2) DEFAULT NULL,
  `screening_method` varchar(100) DEFAULT NULL,
  `results` text DEFAULT NULL,
  `interpretation` varchar(255) DEFAULT NULL,
  `recommendations` text DEFAULT NULL,
  `follow_up_required` tinyint(1) DEFAULT 0,
  `follow_up_date` date DEFAULT NULL,
  `status` enum('pending','completed','abnormal','requires_follow_up') DEFAULT 'pending',
  `screened_by` varchar(100) DEFAULT NULL,
  `reviewed_by` int(11) DEFAULT NULL,
  `lab_name` varchar(100) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `screenings`
--

INSERT INTO `screenings` (`id`, `patient_id`, `patient_name`, `contact_number`, `screening_type`, `screening_date`, `gestational_age`, `birth_weight_kg`, `screening_method`, `results`, `interpretation`, `recommendations`, `follow_up_required`, `follow_up_date`, `status`, `screened_by`, `reviewed_by`, `lab_name`, `notes`, `created_at`, `updated_at`) VALUES
(3, 29, 'jerome Blazo lacson', '09632117373', 'Metabolic Screening', '2025-11-11', NULL, NULL, NULL, 'good', NULL, NULL, 0, '0000-00-00', 'abnormal', 'gg', NULL, NULL, 'gg', '2025-11-04 12:19:08', '2025-11-04 12:19:08'),
(4, 29, 'jerome Blazo lacson', '09632117373', 'Genetic Screening', '2025-11-18', NULL, NULL, NULL, 'sdf', '', '', 0, '0000-00-00', 'completed', 'sd', NULL, '', 'sd', '2025-11-05 17:05:09', '2025-11-05 17:43:35'),
(6, 29, 'jerome Blazo lacson', '09632117373', 'Metabolic Screening', '2025-11-07', NULL, NULL, NULL, 'gfd', NULL, NULL, 1, '2025-11-25', 'pending', 'sdf', NULL, NULL, 'sdfsd', '2025-11-06 07:28:43', '2025-11-06 07:28:43'),
(11, NULL, 'Deadpool wolf marvel', '09362117373', 'Hearing Test', '2025-11-26', NULL, NULL, NULL, 'sdf', NULL, NULL, 0, '0000-00-00', 'abnormal', 'sadf', NULL, NULL, 'sadf', '2025-11-22 03:24:50', '2025-11-22 03:24:50'),
(12, NULL, 'Test Walkin', '09123456789', 'Blood Spot Test', '2025-11-25', NULL, NULL, NULL, 'asd', NULL, NULL, 1, '2025-11-27', 'completed', 'sadf', NULL, NULL, 'sdaf', '2025-11-22 03:29:36', '2025-11-22 03:29:36'),
(13, NULL, 'jesica soho ga', '09123456789', 'Newborn Screening Test', '2025-11-27', NULL, NULL, NULL, 'sdaf', NULL, NULL, 0, NULL, 'completed', 'sadf', NULL, NULL, 'sadf', '2025-11-22 03:45:40', '2025-11-22 03:45:40');

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `category` enum('prenatal_care','lab_results','immunizations','screening','medical_procedures','postpartum','family_planning','general') DEFAULT 'general',
  `duration` int(11) DEFAULT 30,
  `image` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT NULL ON UPDATE current_timestamp(),
  `price` decimal(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `description`, `category`, `duration`, `image`, `status`, `created_at`, `updated_at`, `price`) VALUES
(1, 'Newborn Care', 'Newborn care involves routine health checks to monitor the baby’s development and immediate health needs, including vaccinations. Feeding support is offered for both breastfeeding and formula feeding, while newborn monitoring tracks essential indicators such as weight and jaundice to ensure the baby is healthy.', 'general', 30, '/uploads/image-1756577839359-566529468.jpg', 'active', '2025-05-23 17:17:15', '2025-08-30 18:17:19', 0.00),
(2, 'Maternity and Postpartum Care', '\r\nMaternity and postpartum care services include assistance during childbirth, whether vaginal or cesarean, and routine health assessments for the mother after delivery. Lactation support helps with breastfeeding, including latching and managing milk supply. Postpartum depression screening ensures the mental well-being of the mother, and pelvic floor health services provide recovery exercises and therapy to strengthen muscles affected by childbirth.\r\n', 'postpartum', 30, '/uploads/image-1756577976771-161515341.jpg', 'active', '2025-05-23 17:17:15', '2025-11-03 14:05:41', 0.00),
(4, 'Diagnostic and Laboratory Services', 'Diagnostic services provide routine blood tests to check for anemia, glucose levels, and other common postpartum health concerns. Urine tests help detect infections or monitor kidney function, while ultrasounds are used to assess uterine recovery or identify any complications.', 'lab_results', 45, '/uploads/image-1756577957192-245637948.jpg', 'active', '2025-05-23 17:17:15', '2025-11-03 14:05:41', 0.00),
(5, 'Physical Recovery', 'Physical recovery services include postpartum therapy, with a focus on pelvic floor rehabilitation and general physical recovery from childbirth. Nutrition counseling is also available to help mothers regain strength, support lactation, and ensure a healthy postpartum diet.', 'postpartum', 30, '/uploads/image-1756577915907-963204128.jpg', 'active', '2025-05-25 07:23:49', '2025-11-03 14:05:41', 90.00),
(7, 'Family Planning and Reproductive Health', 'Postpartum family planning services provide counseling on birth control options, while fertility counseling offers guidance on family planning and conception after childbirth, helping parents make informed decisions about their next steps.', 'family_planning', 30, '/uploads/image-1756577876123-735300346.jpg', 'active', '2025-05-25 09:30:03', '2025-11-03 14:05:41', 80.00),
(8, 'labrat', 'gym', 'screening', 23, '/uploads/image-1762179616164-659221744.jpg', 'active', '2025-11-03 14:20:16', NULL, 23.00),
(9, 'Prenatal', 'Paglilihi ni crush', 'prenatal_care', 45, '/uploads/image-1763773200956-946793494.png', 'active', '2025-11-22 01:00:01', NULL, 67.00);

-- --------------------------------------------------------

--
-- Table structure for table `slots`
--

CREATE TABLE `slots` (
  `id` int(11) NOT NULL,
  `date` date NOT NULL,
  `time_slot` varchar(20) NOT NULL,
  `status` enum('available','booked','not_available','holiday') DEFAULT 'available',
  `booking_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `service_type` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `staff`
--

CREATE TABLE `staff` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `position` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `staff`
--

INSERT INTO `staff` (`id`, `name`, `position`, `email`, `phone`, `user_id`, `status`, `created_at`) VALUES
(2, 'jeromelacson2024', 'forn', 'jeromelacson2024@gmail.com', '09632117373', 44, 'active', '2025-10-12 05:09:48');

-- --------------------------------------------------------

--
-- Stand-in structure for view `upcoming_prenatal_visits`
-- (See below for the actual view)
--
CREATE TABLE `upcoming_prenatal_visits` (
`id` int(11)
,`patient_id` int(11)
,`patient_name` varchar(302)
,`phone` varchar(20)
,`visit_number` int(11)
,`trimester` int(11)
,`scheduled_date` date
,`gestational_age` varchar(20)
,`status` enum('scheduled','completed','missed','cancelled')
,`days_until_visit` int(7)
);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','doctor','admin','staff') NOT NULL DEFAULT 'user',
  `license_number` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `doctor_id` int(11) DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `email_verification_token` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `license_number`, `created_at`, `doctor_id`, `email_verified`, `email_verification_token`) VALUES
(21, 'Admin', 'Admin@gmail.com', '$2b$10$PFtZ/ikp0H5ufCLJvounU.YMFws7RaXCuAMmakoOWIjDIjgK7vqMK', 'admin', 'prc 24', '2025-03-19 08:17:38', NULL, 0, NULL),
(44, '', 'jeromelacson2024@gmail.com', '$2b$10$hPofHzkdOlv6i71jed2YzuJPjNQNt/L2/V7Tr9lHlFV4AWiDRmXRS', 'staff', 'Prc2020', '2025-10-12 05:10:09', NULL, 1, NULL),
(45, 'jobielyn', 'lacsonjobielyn@gmail.com', '$2b$10$H7BrQgsmIt5U1DauoxFF/.ZxVnPOOvXWolgIoflqFxDzMg7YMg4DS', 'doctor', 'gg546', '2025-10-12 06:03:39', 14, 1, NULL),
(52, '', 'jeromelacson2020@gmail.com', '$2b$10$93Z8BpgisrZ78rwYI7DZgeM1uZ6aITjxnEyrmMR61bMzIDrE9T8hC', 'user', NULL, '2025-11-01 09:11:04', NULL, 1, NULL),
(53, '', 'testadmin@gmail.com', '$2b$10$ziisovsWLOYgWJHOsbclXe2P52/Q69zCdzHiUnDwd3bGBAb8/tBRi', 'admin', NULL, '2025-11-05 03:39:28', NULL, 1, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `walkin_queue`
--

CREATE TABLE `walkin_queue` (
  `id` int(11) NOT NULL,
  `patient_name` varchar(255) NOT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `triage_level` enum('urgent','normal') DEFAULT 'normal',
  `status` enum('waiting','called','in_room','done','skipped') DEFAULT 'waiting',
  `arrival_time` datetime NOT NULL DEFAULT current_timestamp(),
  `assigned_booking_id` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `service_type` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Structure for view `upcoming_prenatal_visits`
--
DROP TABLE IF EXISTS `upcoming_prenatal_visits`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `upcoming_prenatal_visits`  AS SELECT `ps`.`id` AS `id`, `ps`.`patient_id` AS `patient_id`, trim(concat_ws(' ',`p`.`first_name`,`p`.`middle_name`,`p`.`last_name`)) AS `patient_name`, `p`.`phone` AS `phone`, `ps`.`visit_number` AS `visit_number`, `ps`.`trimester` AS `trimester`, `ps`.`scheduled_date` AS `scheduled_date`, `ps`.`gestational_age` AS `gestational_age`, `ps`.`status` AS `status`, to_days(`ps`.`scheduled_date`) - to_days(curdate()) AS `days_until_visit` FROM (`prenatal_schedule` `ps` join `patients` `p` on(`ps`.`patient_id` = `p`.`id`)) WHERE `ps`.`status` = 'scheduled' AND `ps`.`scheduled_date` between curdate() and curdate() + interval 14 day ORDER BY `ps`.`scheduled_date` ASC ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admissions`
--
ALTER TABLE `admissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admissions_status` (`status`),
  ADD KEY `idx_admissions_user_id` (`user_id`),
  ADD KEY `idx_admissions_booking_id` (`booking_id`),
  ADD KEY `idx_admissions_admitted_at` (`admitted_at`);

--
-- Indexes for table `appointments`
--
ALTER TABLE `appointments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_appointments_date_time` (`date`,`time`);

--
-- Indexes for table `appointment_feedback`
--
ALTER TABLE `appointment_feedback`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_feedback_booking` (`booking_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `appointment_reminders`
--
ALTER TABLE `appointment_reminders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`);

--
-- Indexes for table `babies`
--
ALTER TABLE `babies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admission_id` (`admission_id`),
  ADD KEY `idx_babies_mother` (`mother_patient_id`),
  ADD KEY `idx_babies_birth_date` (`birth_date`);

--
-- Indexes for table `baby_immunizations`
--
ALTER TABLE `baby_immunizations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `baby_id` (`baby_id`),
  ADD KEY `administered_by` (`administered_by`);

--
-- Indexes for table `baby_vitals`
--
ALTER TABLE `baby_vitals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `recorded_by` (`recorded_by`),
  ADD KEY `idx_baby_vitals_baby` (`baby_id`),
  ADD KEY `idx_baby_vitals_date` (`recorded_at`);

--
-- Indexes for table `birth_plans`
--
ALTER TABLE `birth_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_birth_plan_patient` (`patient_id`);

--
-- Indexes for table `booking`
--
ALTER TABLE `booking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `doctor_id` (`doctor_id`),
  ADD KEY `idx_booking_followup_parent` (`follow_up_of_booking_id`),
  ADD KEY `idx_booking_user_date` (`user_id`,`date`),
  ADD KEY `idx_booking_status_date` (`date`,`request_status`,`appointment_status`),
  ADD KEY `idx_booking_follow_up_provider` (`follow_up_provider_type`);

--
-- Indexes for table `doctors`
--
ALTER TABLE `doctors`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `family_planning`
--
ALTER TABLE `family_planning`
  ADD PRIMARY KEY (`id`),
  ADD KEY `counseled_by` (`counseled_by`),
  ADD KEY `idx_family_planning_patient` (`patient_id`),
  ADD KEY `idx_family_planning_date` (`consultation_date`);

--
-- Indexes for table `immunizations`
--
ALTER TABLE `immunizations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_immunizations_patient_id` (`patient_id`),
  ADD KEY `idx_immunizations_patient_type` (`patient_type`),
  ADD KEY `idx_immunizations_date` (`date_given`),
  ADD KEY `idx_immunizations_contact` (`contact_number`),
  ADD KEY `idx_immunizations_vaccine` (`vaccine_type`);

--
-- Indexes for table `lab_results`
--
ALTER TABLE `lab_results`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `ordered_by` (`ordered_by`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `idx_lab_results_patient` (`patient_id`),
  ADD KEY `idx_lab_results_date` (`test_date`);

--
-- Indexes for table `medical_certificates`
--
ALTER TABLE `medical_certificates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `certificate_number` (`certificate_number`),
  ADD KEY `patient_id` (`patient_id`),
  ADD KEY `issued_by` (`issued_by`);

--
-- Indexes for table `medical_notes`
--
ALTER TABLE `medical_notes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `medical_notes_ibfk_2` (`patient_id`);

--
-- Indexes for table `medication_administration`
--
ALTER TABLE `medication_administration`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_med_admin_patient` (`patient_id`);

--
-- Indexes for table `medication_admin_entries`
--
ALTER TABLE `medication_admin_entries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_med_entries_admin` (`administration_id`);

--
-- Indexes for table `newborn_admissions`
--
ALTER TABLE `newborn_admissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_newborn_baby` (`baby_id`);

--
-- Indexes for table `password_resets`
--
ALTER TABLE `password_resets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_token` (`token`),
  ADD KEY `idx_expires` (`expires_at`);

--
-- Indexes for table `patients`
--
ALTER TABLE `patients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `idx_patients_consultation_completed` (`consultation_completed`),
  ADD KEY `idx_patients_lmp` (`last_menstrual_period`),
  ADD KEY `idx_patients_edd` (`expected_delivery_date`);

--
-- Indexes for table `patient_merge_history`
--
ALTER TABLE `patient_merge_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `registered_patient_id` (`registered_patient_id`),
  ADD KEY `merged_by` (`merged_by`);

--
-- Indexes for table `postpartum_care`
--
ALTER TABLE `postpartum_care`
  ADD PRIMARY KEY (`id`),
  ADD KEY `admission_id` (`admission_id`),
  ADD KEY `assessed_by` (`assessed_by`),
  ADD KEY `idx_postpartum_patient` (`patient_id`),
  ADD KEY `idx_postpartum_date` (`assessment_date`);

--
-- Indexes for table `prenatal_schedule`
--
ALTER TABLE `prenatal_schedule`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_prenatal_patient` (`patient_id`),
  ADD KEY `idx_prenatal_date` (`scheduled_date`);

--
-- Indexes for table `procedures`
--
ALTER TABLE `procedures`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_procedures_patient_id` (`patient_id`),
  ADD KEY `idx_procedures_date` (`procedure_date`),
  ADD KEY `idx_procedures_status` (`status`),
  ADD KEY `idx_procedures_category` (`procedure_category`),
  ADD KEY `idx_procedures_patient_name` (`patient_name`),
  ADD KEY `idx_procedures_contact_number` (`contact_number`),
  ADD KEY `idx_procedures_patient` (`patient_id`),
  ADD KEY `idx_procedures_walkin` (`patient_name`,`contact_number`);

--
-- Indexes for table `referrals`
--
ALTER TABLE `referrals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_patient_referrals` (`patient_id`);

--
-- Indexes for table `referral_returns`
--
ALTER TABLE `referral_returns`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_referral_returns` (`referral_id`);

--
-- Indexes for table `screenings`
--
ALTER TABLE `screenings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reviewed_by` (`reviewed_by`),
  ADD KEY `idx_screenings_patient_id` (`patient_id`),
  ADD KEY `idx_screenings_date` (`screening_date`),
  ADD KEY `idx_screenings_status` (`status`),
  ADD KEY `idx_screenings_patient_name` (`patient_name`),
  ADD KEY `idx_screenings_contact_number` (`contact_number`),
  ADD KEY `idx_screenings_patient` (`patient_id`),
  ADD KEY `idx_screenings_walkin` (`patient_name`,`contact_number`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `slots`
--
ALTER TABLE `slots`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_date_time` (`date`,`time_slot`),
  ADD KEY `booking_id` (`booking_id`),
  ADD KEY `idx_slots_user_id` (`user_id`);

--
-- Indexes for table `staff`
--
ALTER TABLE `staff`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `walkin_queue`
--
ALTER TABLE `walkin_queue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_status_arrival` (`status`,`arrival_time`),
  ADD KEY `idx_triage_status` (`triage_level`,`status`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `admissions`
--
ALTER TABLE `admissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=20;

--
-- AUTO_INCREMENT for table `appointments`
--
ALTER TABLE `appointments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=243;

--
-- AUTO_INCREMENT for table `appointment_feedback`
--
ALTER TABLE `appointment_feedback`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `appointment_reminders`
--
ALTER TABLE `appointment_reminders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `babies`
--
ALTER TABLE `babies`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `baby_immunizations`
--
ALTER TABLE `baby_immunizations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `baby_vitals`
--
ALTER TABLE `baby_vitals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `birth_plans`
--
ALTER TABLE `birth_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `booking`
--
ALTER TABLE `booking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=72;

--
-- AUTO_INCREMENT for table `doctors`
--
ALTER TABLE `doctors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `family_planning`
--
ALTER TABLE `family_planning`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=29;

--
-- AUTO_INCREMENT for table `immunizations`
--
ALTER TABLE `immunizations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `lab_results`
--
ALTER TABLE `lab_results`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `medical_certificates`
--
ALTER TABLE `medical_certificates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `medical_notes`
--
ALTER TABLE `medical_notes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `medication_administration`
--
ALTER TABLE `medication_administration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `medication_admin_entries`
--
ALTER TABLE `medication_admin_entries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `newborn_admissions`
--
ALTER TABLE `newborn_admissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `password_resets`
--
ALTER TABLE `password_resets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- AUTO_INCREMENT for table `patients`
--
ALTER TABLE `patients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `patient_merge_history`
--
ALTER TABLE `patient_merge_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `postpartum_care`
--
ALTER TABLE `postpartum_care`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `prenatal_schedule`
--
ALTER TABLE `prenatal_schedule`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `procedures`
--
ALTER TABLE `procedures`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `referrals`
--
ALTER TABLE `referrals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `referral_returns`
--
ALTER TABLE `referral_returns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `screenings`
--
ALTER TABLE `screenings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `slots`
--
ALTER TABLE `slots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=1560;

--
-- AUTO_INCREMENT for table `staff`
--
ALTER TABLE `staff`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `walkin_queue`
--
ALTER TABLE `walkin_queue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `admissions`
--
ALTER TABLE `admissions`
  ADD CONSTRAINT `fk_admissions_booking` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_admissions_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `appointment_feedback`
--
ALTER TABLE `appointment_feedback`
  ADD CONSTRAINT `appointment_feedback_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `appointment_feedback_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `appointment_reminders`
--
ALTER TABLE `appointment_reminders`
  ADD CONSTRAINT `appointment_reminders_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `babies`
--
ALTER TABLE `babies`
  ADD CONSTRAINT `babies_ibfk_1` FOREIGN KEY (`mother_patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `babies_ibfk_2` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `baby_immunizations`
--
ALTER TABLE `baby_immunizations`
  ADD CONSTRAINT `baby_immunizations_ibfk_1` FOREIGN KEY (`baby_id`) REFERENCES `babies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `baby_immunizations_ibfk_2` FOREIGN KEY (`administered_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `baby_vitals`
--
ALTER TABLE `baby_vitals`
  ADD CONSTRAINT `baby_vitals_ibfk_1` FOREIGN KEY (`baby_id`) REFERENCES `babies` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `baby_vitals_ibfk_2` FOREIGN KEY (`recorded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `booking`
--
ALTER TABLE `booking`
  ADD CONSTRAINT `booking_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_booking_followup_parent` FOREIGN KEY (`follow_up_of_booking_id`) REFERENCES `booking` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `family_planning`
--
ALTER TABLE `family_planning`
  ADD CONSTRAINT `family_planning_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `family_planning_ibfk_2` FOREIGN KEY (`counseled_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `immunizations`
--
ALTER TABLE `immunizations`
  ADD CONSTRAINT `immunizations_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `lab_results`
--
ALTER TABLE `lab_results`
  ADD CONSTRAINT `lab_results_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `lab_results_ibfk_2` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `lab_results_ibfk_3` FOREIGN KEY (`ordered_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `lab_results_ibfk_4` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `medical_certificates`
--
ALTER TABLE `medical_certificates`
  ADD CONSTRAINT `medical_certificates_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `medical_certificates_ibfk_2` FOREIGN KEY (`issued_by`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `medical_notes`
--
ALTER TABLE `medical_notes`
  ADD CONSTRAINT `medical_notes_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `medical_notes_ibfk_2` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `patients`
--
ALTER TABLE `patients`
  ADD CONSTRAINT `patients_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `patient_merge_history`
--
ALTER TABLE `patient_merge_history`
  ADD CONSTRAINT `patient_merge_history_ibfk_1` FOREIGN KEY (`registered_patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `patient_merge_history_ibfk_2` FOREIGN KEY (`merged_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `postpartum_care`
--
ALTER TABLE `postpartum_care`
  ADD CONSTRAINT `postpartum_care_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `postpartum_care_ibfk_2` FOREIGN KEY (`admission_id`) REFERENCES `admissions` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `postpartum_care_ibfk_3` FOREIGN KEY (`assessed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `prenatal_schedule`
--
ALTER TABLE `prenatal_schedule`
  ADD CONSTRAINT `prenatal_schedule_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `procedures`
--
ALTER TABLE `procedures`
  ADD CONSTRAINT `procedures_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `screenings`
--
ALTER TABLE `screenings`
  ADD CONSTRAINT `screenings_ibfk_1` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `screenings_ibfk_2` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `slots`
--
ALTER TABLE `slots`
  ADD CONSTRAINT `fk_slots_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `slots_ibfk_1` FOREIGN KEY (`booking_id`) REFERENCES `booking` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `staff`
--
ALTER TABLE `staff`
  ADD CONSTRAINT `staff_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
