//! Canonical RFC 6920 SHA-256 Named Information identity.
//!
//! This is the Rust projection of the same byte-identity law exported by the
//! package's JavaScript /ni subpath. It deliberately knows nothing about RMN,
//! semantic settlement, proof paths, storage paths, or carrier-local IDs.

use base64::{engine::general_purpose::URL_SAFE_NO_PAD, Engine as _};
use sha2::{Digest, Sha256};
use std::{error::Error, fmt};

/// Canonical prefix for one SHA-256 Named Information URI.
pub const SHA256_NI_PREFIX: &str = "ni:///sha-256;";

/// Refusal returned when a string is not the one canonical SHA-256 NI spelling.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct MalformedNi;

impl fmt::Display for MalformedNi {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str("value must be one canonical RFC 6920 SHA-256 ni URI")
    }
}

impl Error for MalformedNi {}

/// Render verified SHA-256 digest bytes as the canonical unpadded base64url NI.
#[must_use]
pub fn sha256_ni_uri_from_digest(digest: &[u8; 32]) -> String {
    format!("{SHA256_NI_PREFIX}{}", URL_SAFE_NO_PAD.encode(digest))
}

/// Hash exact content bytes and render their canonical SHA-256 NI.
#[must_use]
pub fn sha256_ni_uri(bytes: &[u8]) -> String {
    let digest: [u8; 32] = Sha256::digest(bytes).into();
    sha256_ni_uri_from_digest(&digest)
}

/// Decode one canonical SHA-256 NI to its 32 digest bytes.
///
/// # Errors
///
/// Returns MalformedNi for wrong schemes/algorithms, padding, malformed
/// base64url, wrong digest width, or any noncanonical alternate spelling.
pub fn sha256_digest_from_ni_uri(value: &str) -> Result<[u8; 32], MalformedNi> {
    let encoded = value.strip_prefix(SHA256_NI_PREFIX).ok_or(MalformedNi)?;
    if encoded.is_empty() || encoded.contains('=') {
        return Err(MalformedNi);
    }
    let decoded = URL_SAFE_NO_PAD.decode(encoded).map_err(|_| MalformedNi)?;
    let digest: [u8; 32] = decoded.try_into().map_err(|_| MalformedNi)?;
    if URL_SAFE_NO_PAD.encode(digest) != encoded {
        return Err(MalformedNi);
    }
    Ok(digest)
}

/// Return true only for the one canonical SHA-256 NI spelling.
#[must_use]
pub fn is_canonical_sha256_ni_uri(value: &str) -> bool {
    sha256_digest_from_ni_uri(value).is_ok()
}

/// Verify that exact bytes reproduce the supplied canonical SHA-256 NI.
#[must_use]
pub fn verify_sha256_ni_uri(bytes: &[u8], value: &str) -> bool {
    let Ok(expected) = sha256_digest_from_ni_uri(value) else {
        return false;
    };
    let actual: [u8; 32] = Sha256::digest(bytes).into();
    actual == expected
}

#[cfg(test)]
mod tests {
    use super::*;

    const VECTORS: &[(&[u8], &str)] = &[
        (
            b"",
            "ni:///sha-256;47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU",
        ),
        (
            b"hello",
            "ni:///sha-256;LPJNul-wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ",
        ),
        (
            b"semantic-content-ni-api",
            "ni:///sha-256;koqacr8nz6PJjJUPQ9zy04JpLJiP3DSvPGDioN_dqBU",
        ),
        (
            b"generator-structure-v1",
            "ni:///sha-256;P9aerRH7UoiKXbVOngVv9gfOHUZPA6RKNosJQtLPPww",
        ),
    ];

    #[test]
    fn reproduces_estate_conformance_vectors() {
        for (bytes, expected) in VECTORS {
            assert_eq!(sha256_ni_uri(bytes), *expected);
            assert!(is_canonical_sha256_ni_uri(expected));
            assert!(verify_sha256_ni_uri(bytes, expected));
            let digest = sha256_digest_from_ni_uri(expected).unwrap();
            assert_eq!(sha256_ni_uri_from_digest(&digest), *expected);
        }
    }

    #[test]
    fn refuses_aliases_padding_and_changed_bytes() {
        let canonical = VECTORS[1].1;
        assert!(!is_canonical_sha256_ni_uri("sha256:deadbeef"));
        assert!(!is_canonical_sha256_ni_uri(
            "ni:///sha-256;LPJNul-wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ="
        ));
        assert!(!is_canonical_sha256_ni_uri(
            "NI:///sha-256;LPJNul-wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ"
        ));
        assert!(!verify_sha256_ni_uri(b"HELLO", canonical));
    }
}
