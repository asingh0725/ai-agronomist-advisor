//
//  AuthViewModelTests.swift
//  CropCopilotTests
//
//  Created by Claude Code on Phase 1
//

import XCTest
@testable import CropCopilot

@MainActor
class AuthViewModelTests: XCTestCase {
    var viewModel: AuthViewModel!
    var mockRepository: MockAuthRepository!

    override func setUp() async throws {
        mockRepository = MockAuthRepository()
        viewModel = AuthViewModel()
        // Note: In real tests, you'd inject mockRepository via dependency injection
    }

    override func tearDown() {
        viewModel = nil
        mockRepository = nil
    }

    func testSignInSuccess() async {
        // Given
        let email = "test@example.com"
        let password = "password123"
        mockRepository.shouldSucceed = true

        // When
        await viewModel.signIn(email: email, password: password)

        // Then
        XCTAssertTrue(viewModel.isAuthenticated)
        XCTAssertNotNil(viewModel.currentUser)
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    func testSignInFailure() async {
        // Given
        let email = "test@example.com"
        let password = "wrongpassword"
        mockRepository.shouldSucceed = false

        // When
        await viewModel.signIn(email: email, password: password)

        // Then
        XCTAssertFalse(viewModel.isAuthenticated)
        XCTAssertNil(viewModel.currentUser)
        XCTAssertNotNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    func testSignOut() async {
        // Given
        viewModel.isAuthenticated = true
        viewModel.currentUser = User(id: "123", email: "test@example.com", createdAt: Date())

        // When
        await viewModel.signOut()

        // Then
        XCTAssertFalse(viewModel.isAuthenticated)
        XCTAssertNil(viewModel.currentUser)
    }
}

// MARK: - Mock Repository
class MockAuthRepository {
    var shouldSucceed = true

    func signIn(email: String, password: String) async throws -> User {
        if shouldSucceed {
            return User(id: "123", email: email, createdAt: Date())
        } else {
            throw NSError(domain: "AuthError", code: 401, userInfo: [NSLocalizedDescriptionKey: "Invalid credentials"])
        }
    }
}
