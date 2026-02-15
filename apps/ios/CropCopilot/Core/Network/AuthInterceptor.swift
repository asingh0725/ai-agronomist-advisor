//
//  AuthInterceptor.swift
//  CropCopilot
//
//  Created by Claude Code on Phase 1
//

import Foundation

actor AuthInterceptor {
    private let keychainManager = KeychainManager.shared
    private var isRefreshing = false
    private var refreshContinuation: CheckedContinuation<String, Error>?

    func addAuthHeader(to request: inout URLRequest) {
        if let token = keychainManager.get(for: .accessToken) {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
    }

    func handleUnauthorized() async throws -> String {
        // If already refreshing, wait for the result
        if isRefreshing {
            return try await withCheckedThrowingContinuation { continuation in
                self.refreshContinuation = continuation
            }
        }

        isRefreshing = true

        do {
            let newToken = try await refreshToken()
            isRefreshing = false
            refreshContinuation?.resume(returning: newToken)
            refreshContinuation = nil
            return newToken
        } catch {
            isRefreshing = false
            refreshContinuation?.resume(throwing: error)
            refreshContinuation = nil
            throw error
        }
    }

    private func refreshToken() async throws -> String {
        guard let refreshToken = keychainManager.get(for: .refreshToken) else {
            throw NetworkError.unauthorized
        }

        // Create refresh request
        let url = URL(string: Configuration.apiBaseURL + "/auth/refresh")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body = ["refresh_token": refreshToken]
        request.httpBody = try? JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              httpResponse.statusCode == 200 else {
            throw NetworkError.unauthorized
        }

        struct RefreshResponse: Codable {
            let access_token: String
            let refresh_token: String?
        }

        let refreshResponse = try JSONDecoder().decode(RefreshResponse.self, from: data)

        // Save new tokens
        _ = keychainManager.save(refreshResponse.access_token, for: .accessToken)
        if let newRefreshToken = refreshResponse.refresh_token {
            _ = keychainManager.save(newRefreshToken, for: .refreshToken)
        }

        return refreshResponse.access_token
    }
}
