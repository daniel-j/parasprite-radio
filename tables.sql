
USE paraspriteradio;
/*
DROP TABLE IF EXISTS `music-category`;
DROP TABLE IF EXISTS `category`;		
DROP TABLE IF EXISTS `track`;
*/
DROP TABLE IF EXISTS `user`;
DROP TABLE IF EXISTS `userlevel`;

/*
CREATE TABLE IF NOT EXISTS `category` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `enabled` TINYINT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
);
# artist,album,title,track,name,genre,date,composer,performer,disc"

CREATE TABLE IF NOT EXISTS `track` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `filename` VARCHAR(255) NOT NULL,
  `track` INTEGER DEFAULT NULL,
  `title` VARCHAR(255) NOT NULL,
  `artist` VARCHAR(255) NOT NULL,
  `album` VARCHAR(255) DEFAULT NULL,
  `albumartist` VARCHAR(255) DEFAULT NULL,
  `genre` VARCHAR(255) DEFAULT NULL,
  `time` INTEGER NOT NULL,
  `date_added` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
);

CREATE TABLE IF NOT EXISTS `music-category` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `category_id` INTEGER NOT NULL,
  `track_id` INTEGER NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (category_id) REFERENCES `category` (`id`),
  FOREIGN KEY (track_id) REFERENCES `track` (`id`)
);
*/



CREATE TABLE `userlevel` (
  `id` INTEGER NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  PRIMARY KEY (`id`)
);

CREATE TABLE `user` (
  `id` INTEGER NOT NULL,
  `username` VARCHAR(255) NOT NULL UNIQUE,
  `displayName` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `level` INTEGER NOT NULL DEFAULT 0,
  `image` VARCHAR(255) NOT NULL DEFAULT "",
  PRIMARY KEY (`id`),
  FOREIGN KEY (level) REFERENCES `userlevel` (`id`)
);


/*
ALTER TABLE `category` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `track` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `music-category` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
*/

ALTER TABLE `userlevel` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;
ALTER TABLE `user` ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

INSERT INTO userlevel (id, title) VALUES (0, "User");
INSERT INTO userlevel (id, title) VALUES (10, "Owner");