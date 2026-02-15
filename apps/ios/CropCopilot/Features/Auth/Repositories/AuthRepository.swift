//
//  AuthRepository.swift
//  CropCopilot
//
//  Created by Claude Code on Phase 1
//

import Foundation
import Supabase
import AuthenticationServices

class AuthRepository {
    private let supabase: SupabaseClient
    private let keychainManager = KeychainManager.shared

    init(supabase: SupabaseClient) {
        self.supabase = supabase
    }

    // MARK: - Sign In
    func signIn(email: String, password: String) async throws -> User {
        let session = try await supabase.auth.signIn(
            email: email,
            password: password
        )

        // Save tokens to Keychain
        _ = keychainManager.save(session.accessToken, for: .accessToken)
        _ = keychainManager.save(session.refreshToken ?? "", for: .refreshToken)

        return User(
            id: session.user.id.uuidString,
            email: session.user.email ?? email,
            createdAt: session.user.createdAt
        )
    }

    // MARK: - Sign Up
    func signUp(email: String, password: String) async throws -> User {
        let session = try await supabase.auth.signUp(
            email: email,
            password: password
        )

        // Save tokens to Keychain
        if let accessToken = session.session?.accessToken {
            _ = keychainManager.save(accessToken, for: .accessToken)
        }
        if let refreshToken = session.session?.refreshToken {
            _ = keychainManager.save(refreshToken, for: .refreshToken)
        }

        return User(
            id: session.user?.id.uuidString ?? "",
            email: session.user?.email ?? email,
            createdAt: session.user?.createdAt
        )
    }

    // MARK: - Sign In with Apple
    func signInWithApple(idToken: String, nonce: String) async throws -> User {
        let session = try await supabase.auth.signInWithIdToken(
            credentials: .init(
                provider: .apple,
                idToken: idToken,
                nonce: nonce
            )
        )

        // Save tokens to Keychain
        _ = keychainManager.save(session.accessToken, for: .accessToken)
        _ = keychainManager.save(session.refreshToken ?? "", for: .refreshToken)

        return User(
            id: session.user.id.uuidString,
            email: session.user.email ?? "",
            createdAt: session.user.createdAt
        )
    }

    // MARK: - Sign Out
    func signOut() async throws {
        try await supabase.auth.signOut()
        keychainManager.deleteAll()
    }

    // MARK: - Refresh Session
    func refreshSession() async throws {
        guard let refreshToken = keychainManager.get(for: .refreshToken) else {
            throw NetworkError.unauthorized
        }

        let session = try await supabase.auth.setSession(
            accessToken: keychainManager.get(for: .accessToken) ?? "",
            refreshToken: refreshToken
        )

        // Update tokens in Keychain
        _ = keychainManager.save(session.accessToken, for: .accessToken)
        if let newRefreshToken = session.refreshToken {
            _ = keychainManager.save(newRefreshToken, for: .refreshToken)
        }
    }

    // MARK: - Get Current User
    func getCurrentUser() async throws -> User? {
        // Check if we have tokens in Keychain
        guard keychainManager.get(for: .accessToken) != nil else {
            return nil
        }

        // Get user from Supabase
        let user = try await supabase.auth.user()

        return User(
            id: user.id.uuidString,
            email: user.email ?? "",
            createdAt: user.createdAt
        )
    }

    // MARK: - Reset Password
    func resetPassword(email: String) async throws {
        try await supabase.auth.resetPasswordForEmail(email)
    }
}
