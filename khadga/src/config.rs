//! Defines the configuration data structure we will use

use config::{Config,
             ConfigError,
             File};
use serde::{Deserialize,
            Serialize};
use std::fmt;

#[derive(Deserialize, Serialize, Debug)]
pub struct MongoCfg {
    pub host: String,
    pub port: Option<String>,
    pub database: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct MimirConfig {
    pub node_ip_service_service_host: String,
    pub node_ip_service_service_port: u16,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct KhadgaCfg {
    pub host: String,
    pub port: String,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Services {
    /* pub mimir: MimirConfig, */
    pub khadga: KhadgaCfg,
}

#[derive(Deserialize, Serialize, Debug)]
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

#[derive(Deserialize, Serialize, Debug)]
pub struct LogCfg {
    pub level: LogLevels,
}

#[derive(Deserialize, Serialize, Debug)]
pub struct TLS {
    pub set: bool,
    pub ca_path: String,
    pub key_path: String,
}

impl fmt::Display for TLS {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "set: {}\nca_path: {}\nkey_path: {}",
            self.set, self.ca_path, self.key_path
        )
    }
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

impl fmt::Display for MimirConfig {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "host: {}\nport: {}",
            self.node_ip_service_service_host,
            self.node_ip_service_service_port
        )
    }
}

#[derive(Deserialize, Serialize, Debug)]
pub struct Settings {
    pub services: Services,
    pub logging: LogCfg,
    pub tls: TLS,
    pub host: String,
    pub port: u16
}

impl fmt::Display for Settings {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        write!(
            f,
            "khadga:---\n{}\nlogging:---\n{}",
            self.services.khadga, self.logging.level
        )
    }
}

/// When we create a Settings object, we will use the Config crate to merge the yaml settings to
/// actually generate the object.
impl Settings {
    pub fn new() -> Result<Self, ConfigError> {
        let mut config = Config::default();

        match std::env::var("KHADGA_DEV") {
            Ok(val) if val.to_lowercase() == "true" => {
                config.merge(File::with_name("config/khadga-dev.yml"))?;
                std::env::set_var("MIMIR_NODE_IP_SERVICE_SERVICE_HOST", "localhost");
                std::env::set_var("MIMIR_NODE_IP_SERVICE_SERVICE_PORT", "3000");
                
                for (k, v) in std::env::vars().filter(|(key, _)| {
                    return key.starts_with("MIMIR_NODE_IP_SERVICE_SERVICE")
                }) {
                    println!("{} = {}", k, v);
                }

                config.merge(config::Environment::with_prefix("MIMIR_NODE_IP_SERVICE_SERVICE"))?;
            }
            _ => {
                config.merge(File::with_name("config/dev.yml"))?;
            }
        }

        config.try_into()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_settings() -> Result<(), Box<dyn std::error::Error>> {
        std::env::set_var("KHADGA_DEV", "true");
        let settings = Settings::new()?;
        println!("Settings = {:#?}", settings);

        let mut khadga_host: String = "0.0.0.0".into();
        if let Ok(_) = std::env::var("KHADGA_DEV") {
            khadga_host = "localhost".into();
        }

        let Settings { host: mimir_host, .. } = settings;
        println!(
            "khadga_host = {}, settings.services.khadga.host = {}", 
            khadga_host,
            mimir_host
        );
        assert_eq!(khadga_host, mimir_host);
        assert_eq!("7001", settings.services.khadga.port);
        /* assert_eq!(mimir_host, settings.services.mimir.host); */
        assert_eq!("debug", settings.logging.level.repr());

        assert_eq!(true, settings.tls.set);

        std::env::remove_var("KHADGA_DEV");
        let settings = Settings::new()?;
        //assert_eq!(false, settings.tls.set);

        Ok(())
    }
}
