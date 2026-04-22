-- Non-destructive seed import from member one dump
-- This script upserts resources, students, and users without dropping tables.

START TRANSACTION;

INSERT INTO resources (
  id,
  availability_windows,
  capacity,
  created_at,
  created_by,
  daily_rate,
  description,
  image_url,
  is_available,
  location,
  name,
  resource_code,
  status,
  type,
  updated_at
) VALUES
  (1, '{"mode":"FIXED_DAILY","startTime":"08:30","endTime":"20:30","slotDurationMinutes":60}', 800, '2026-04-13 12:33:38.959189', 'resource_manager_1', 0, 'Newly renovated lecture hall with advanced AV system', '/api/resource-manager/images/7667899f-6860-42e1-94a6-f4043513cc3d.jpg', b'0', 'Building A, Floor 1', 'Main Lecture Hall', 'B402', 'ACTIVE', 'LECTURE_HALL', '2026-04-16 08:35:43.614987'),
  (2, '', 50, '2026-04-13 12:34:08.934326', 'resource_manager_1', 0, 'Computer lab with 50 workstations', '/api/resource-manager/images/8dd3f604-56f9-4326-b8b4-116a2b4b08ba.jpg', b'0', 'Building B, Floor 2', 'Computer Science Lab', 'LAB202', 'MAINTENANCE', 'LAB', '2026-04-16 05:21:35.403563'),
  (3, '', 1, '2026-04-13 12:34:23.208807', 'resource_manager_1', 0, '4K Ultra HD Projector', '/api/resource-manager/images/65d7e135-ceed-417f-8794-4e83aed6bdf8.jpg', b'1', 'AV Room, Building C', 'Epson Projector', 'PROJ001', 'ACTIVE', 'PROJECTOR', '2026-04-16 05:23:46.293433'),
  (4, '', 6, '2026-04-13 12:34:40.152165', 'resource_manager_1', 0, 'Premium meeting room with video conferencing', '/api/resource-manager/images/828345b0-36da-406a-a6fb-1b0ac743ed98.jpg', b'1', 'Building A, Floor 3', 'Executive Meeting Room', 'MR301', 'ACTIVE', 'MEETING_ROOM', '2026-04-16 05:30:06.117642'),
  (5, '', 1, '2026-04-13 12:34:50.859835', 'resource_manager_1', 0, '4K Professional Video Camera', '/api/resource-manager/images/1e076f87-4710-4f48-8c3c-6e72f05875e0.jpg', b'1', 'Media Center', 'Sony Professional Camera', 'CAM001', 'ACTIVE', 'CAMERA', '2026-04-16 05:28:02.622012'),
  (7, '', 100, '2026-04-15 15:40:19.120816', 'resource_manager_1', 0, 'vbnm', '/api/resource-manager/images/f8f35bb6-412f-4691-83a1-2d7b7cdfc920.jpg', b'1', 'dfghjkl', 'lab one', 'LAB 2', 'ACTIVE', 'LAB', '2026-04-16 05:56:26.727052'),
  (9, '{"mode":"FIXED_DAILY","startTime":"08:30","endTime":"20:30","slotDurationMinutes":60}', 50, '2026-04-16 09:51:19.680131', 'resource_manager_1', 0, 'A well-equipped university gym that supports students health, fitness, and overall well-being.', '/api/resource-manager/images/ea226128-fb5a-424d-813d-64931774703c.jpg', b'1', 'Main Building, Floor1', 'GYM', 'G101', 'ACTIVE', 'SPORTS_FACILITY', '2026-04-16 09:51:19.680131'),
  (10, '{"mode":"FIXED_DAILY","startTime":"08:30","endTime":"20:30","slotDurationMinutes":60}', 20000, '2026-04-16 09:56:42.947688', 'resource_manager_1', 0, 'A spacious auditorium designed to host lectures, events, seminars, and large university gatherings comfortably.', '/api/resource-manager/images/96a1349c-097d-4752-8127-a7e08901c440.jpg', b'1', 'Auditorium', 'Auditorium', 'A101', 'ACTIVE', 'AUDITORIUM', '2026-04-16 10:05:49.711519'),
  (11, '{"mode":"FIXED_DAILY","startTime":"08:30","endTime":"20:30","slotDurationMinutes":60}', 10, '2026-04-16 10:00:29.299042', 'resource_manager_1', 0, 'A quiet and comfortable library working area designed for focused study, research, and collaborative academic work.', '/api/resource-manager/images/b5443131-6a80-4b65-aac7-e4416baf5294.jpg', b'0', 'Library,Block A', 'Library Space', 'L202', 'MAINTENANCE', 'LIBRARY_SPACE', '2026-04-16 10:02:26.899913')
ON DUPLICATE KEY UPDATE
  availability_windows = VALUES(availability_windows),
  capacity = VALUES(capacity),
  created_by = VALUES(created_by),
  daily_rate = VALUES(daily_rate),
  description = VALUES(description),
  image_url = VALUES(image_url),
  is_available = VALUES(is_available),
  location = VALUES(location),
  name = VALUES(name),
  status = VALUES(status),
  type = VALUES(type),
  updated_at = VALUES(updated_at);

INSERT INTO students (
  id,
  student_id,
  name,
  email,
  password,
  phone,
  address,
  course,
  year,
  semester,
  date_of_birth,
  gender,
  status,
  is_active,
  created_at,
  updated_at
) VALUES
  (1, 'STU006', 'Dinal Chamodya', 'dinali.c@northbridge.com', '123456', '1111111111', '123 Main Street, New York', 'Data Science', 3, 1, '2003-07-14', 'Female', 'ACTIVE', 1, '2026-04-13 11:34:51.000000', '2026-04-16 15:12:30.270173'),
  (2, 'STU001', 'Visna Sithmi', 'visna.s@northbridge.com', '123456', '2222222222', '123 Main Street, New York', 'Data Science', 3, 1, '2003-12-03', 'Female', 'ACTIVE', 1, '2026-04-13 11:35:41.000000', '2026-04-16 16:42:50.765985'),
  (3, 'STU002', 'Primesh Marasingha', 'primesh.m@northbridge.com', '123456', '3333333333', '123 Main Street, New York', 'Data Science', 3, 1, '2003-10-03', 'Male', 'ACTIVE', 1, '2026-04-13 11:36:31.000000', '2026-04-16 16:42:33.205871'),
  (6, 'STU008', 'Thusitha', 'thusitha@gmail.com', '123456', '0718116346', '22B,Dalupotha,Negambo', 'Software Engineering', 1, 1, NULL, 'Male', 'ACTIVE', 1, '2026-04-16 16:41:49.663988', '2026-04-16 16:41:49.663988')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  phone = VALUES(phone),
  address = VALUES(address),
  course = VALUES(course),
  year = VALUES(year),
  semester = VALUES(semester),
  date_of_birth = VALUES(date_of_birth),
  gender = VALUES(gender),
  status = VALUES(status),
  is_active = VALUES(is_active),
  updated_at = VALUES(updated_at);

INSERT INTO users (
  id,
  email,
  name,
  password,
  role,
  created_at,
  is_active,
  updated_at
) VALUES
  (1, 'admin@campus.com', 'System Admin', 'admin123', 'ADMIN', '2026-04-15 12:15:32.000000', b'1', '2026-04-15 12:15:33.000000'),
  (3, 'booking.m@campus.com', 'Primesh Marasingha', '123456', 'BOOKING_MANAGER', '2026-04-15 12:15:32.000000', b'1', '2026-04-15 08:54:36.500443'),
  (4, 'issue.m@campus.com', 'Dinali Chamodya', '123456', 'ISSUE_MANAGER', '2026-04-15 12:15:32.000000', b'1', '2026-04-15 08:58:29.666016'),
  (5, 'resource.m@campus.com', 'Visna Sithmi', '123456', 'RESOURCE_MANAGER', '2026-04-15 12:15:32.000000', b'1', '2026-04-15 08:55:02.506085')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  password = VALUES(password),
  role = VALUES(role),
  is_active = VALUES(is_active),
  updated_at = VALUES(updated_at);

COMMIT;
