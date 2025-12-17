-- Create topics table
CREATE TABLE IF NOT EXISTS `topics` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `slug` varchar(100) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `icon` varchar(50) DEFAULT 'cube-outline',
  `follower_count` int(11) DEFAULT 0,
  `post_count` int(11) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create topic_followers table
CREATE TABLE IF NOT EXISTS `topic_followers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `topic_id` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_topic` (`user_id`, `topic_id`),
  KEY `user_id` (`user_id`),
  KEY `topic_id` (`topic_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add topic_id to posts table if not exists
-- (Safe way to add column only if it doesn't exist requires procedure or check, simplified here for script execution)
ALTER TABLE `posts` ADD COLUMN `topic_id` INT(11) DEFAULT NULL;
ALTER TABLE `posts` ADD KEY `topic_id` (`topic_id`);

-- Seed Initial Topics
INSERT IGNORE INTO `topics` (`slug`, `name`, `description`, `icon`) VALUES
('edebiyat', 'Edebiyat & Kitap', 'Kitap alıntıları, incelemeler ve edebi tartışmalar.', 'book-outline'),
('sinema', 'Sinema & Dizi', 'Film replikleri, dizi önerileri ve sinema dünyası.', 'film-outline'),
('muzik', 'Müzik', 'Şarkı sözleri, albüm incelemeleri ve müzik önerileri.', 'musical-notes-outline'),
('alinti', 'Alıntı', 'Etkileyici sözler ve aforizmalar.', 'format-quote-outline'),
('siir', 'Şiir', 'Şiirler ve şairler üzerine.', 'feather-outline'),
('bilim', 'Bilim & Teknoloji', 'Bilimsel gelişmeler ve teknoloji sohbetleri.', 'hardware-chip-outline'),
('felsefe', 'Felsefe', 'Felsefi düşünceler ve sorgulamalar.', 'bulb-outline'),
('sanat', 'Sanat', 'Resim, heykel ve diğer sanat dalları.', 'color-palette-outline'),
('kisisel-gelisim', 'Kişisel Gelişim', 'Motivasyon, üretkenlik ve yaşam üzerine.', 'trending-up-outline'),
('mizah', 'Mizah', 'Eğlenceli içerikler ve mizah.', 'happy-outline');
