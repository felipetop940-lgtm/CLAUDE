CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(190) NOT NULL,
  address VARCHAR(255),
  place_id VARCHAR(255) NOT NULL,
  lat DECIMAL(10,7) NOT NULL,
  lng DECIMAL(10,7) NOT NULL,
  share_token CHAR(32) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS keywords (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  keyword VARCHAR(190) NOT NULL,
  grid_size TINYINT NOT NULL DEFAULT 7,
  radius_km DECIMAL(5,2) NOT NULL DEFAULT 3.00,
  active TINYINT(1) NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS scans (
  id INT AUTO_INCREMENT PRIMARY KEY,
  keyword_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  avg_rank DECIMAL(5,2),
  top3_pct DECIMAL(5,1),
  found_pct DECIMAL(5,1),
  points LONGTEXT,
  competitors LONGTEXT,
  engine VARCHAR(20) NULL,
  area LONGTEXT NULL,
  INDEX idx_kw_date (keyword_id, created_at),
  FOREIGN KEY (keyword_id) REFERENCES keywords(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- As tabelas meta, places_cache, notes, tasks e profile_stats são criadas sozinhas pelo sistema no primeiro acesso.
