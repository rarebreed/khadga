//! Since hyper and tokio are still in alpha, the web frameworks like gotham, warp, etc are still not making
//! use of aync-await.  Since we're on bleeding edge, we're going to make our own little routing library

pub mod data;
pub mod db;