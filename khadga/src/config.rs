//! Defines the configuration data structure we will use

use config::{Config,
             ConfigError,
             File};
use serde::{Deserialize,
            Serialize};
use std::fmt;

#[derive(Deserialize, Serialize)]
pub struct MongoCfg {
    pub host: String,
    pub port: Option<String>,
    pub database: String,
}

#[derive(Deserialize, Serialize)]
pub struct KhadgaCfg {
    pub host: String,
    pub port: String,
}

#[derive(Deserialize, Serialize)]
pub struct Services {
    pub mongod: MongoCfg,
    pub khadga: KhadgaCfg,
}

#[derive(Deserialize, Serialize)]
pub enum LogLevels {
    Trace,
    Debug,
    Warn,
    Info,
    Error,
}

impl LogLevels {
    pub fn repr(&self) -> &'static str {
        match self {
            LogLevels::Trace => "trace",
            LogLevels::Debug => "debug",
            LogLevels::Warn => "warn",
            LogLevels::Info => "info",
            LogLevels::Error => "error",
        }
    }
}

impl fmt::Display for LogLevels {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "level: {}", self.repr())
    }
}

#[derive(Deserialize, Serialize)]
pub struct LogCfg {
    pub level: LogLevels,
}

#[derive(Deserialize, Serialize)]
pub struct Settings {
    pub services: Services,
    pub logging: LogCfg,
}

impl fmt::Display for MongoCfg {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        let port = match &self.port {
            Some(p) => p,
            None => "",
        };

        write!(
            f,
            "host: {}\nport: {}\ndatabase: {}",
            self.host, port, self.database
        )
    }
}

impl fmt::Display for KhadgaCfg {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(f, "host: {}\nport: {}", self.host, self.port)
    }
}

impl fmt::Display for Settings {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "mongo:---\n{}\nkhadga:---\n{}\nlogging:---\n{}",
            self.services.mongod, self.services.khadga, self.logging.level
        )
    }
}

impl Settings {
    pub fn new() -> Result<Self, ConfigError> {
        let mut config = Config::default();
        config.merge(File::with_name("config/dev.yml"))?;

        match std::env::var("KHADGA_DEV") {
            Ok(val) => {
                if val == "true" || val == "TRUE" || val == "True" {
                    config.merge(File::with_name("config/khadga-dev.yml"))?;
                }
            }
            _ => {}
        }

        config.try_into()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_settings() -> Result<(), Box<dyn std::error::Error>> {
        let settings = Settings::new()?;
        println!("{}", settings);

        let mut khadga_host: String = "0.0.0.0".into();
        let mut mongod_host: String = "0.0.0.0".into();
        if let Ok(_) = std::env::var("KHADGA_DEV") {
            khadga_host = "127.0.0.1".into();
            mongod_host = "127.0.0.1".into();
        }

        assert_eq!(khadga_host, settings.services.khadga.host);
        assert_eq!("7001", settings.services.khadga.port);
        assert_eq!(mongod_host, settings.services.mongod.host);
        assert_eq!("debug", settings.logging.level.repr());

        Ok(())
    }
}
