//
//  ProfileViewModelTests.swift
//  CropCopilotTests
//
//  Created by Claude Code on Phase 2
//

import XCTest
@testable import CropCopilot

@MainActor
final class ProfileViewModelTests: XCTestCase {

    func testInitialState() {
        let viewModel = ProfileViewModel()
        XCTAssertEqual(viewModel.location, "")
        XCTAssertEqual(viewModel.farmSize, "")
        XCTAssertTrue(viewModel.selectedCrops.isEmpty)
        XCTAssertNil(viewModel.experienceLevel)
        XCTAssertFalse(viewModel.isSaving)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertNil(viewModel.successMessage)
    }

    func testToggleCropAdds() {
        let viewModel = ProfileViewModel()
        viewModel.toggleCrop("Corn")
        XCTAssertTrue(viewModel.selectedCrops.contains("Corn"))
    }

    func testToggleCropRemoves() {
        let viewModel = ProfileViewModel()
        viewModel.toggleCrop("Corn")
        viewModel.toggleCrop("Corn")
        XCTAssertFalse(viewModel.selectedCrops.contains("Corn"))
    }

    func testToggleMultipleCrops() {
        let viewModel = ProfileViewModel()
        viewModel.toggleCrop("Corn")
        viewModel.toggleCrop("Soybeans")
        viewModel.toggleCrop("Wheat")
        XCTAssertEqual(viewModel.selectedCrops.count, 3)
        viewModel.toggleCrop("Soybeans")
        XCTAssertEqual(viewModel.selectedCrops.count, 2)
        XCTAssertFalse(viewModel.selectedCrops.contains("Soybeans"))
    }

    func testAvailableCropsMatchWebApp() {
        let viewModel = ProfileViewModel()
        XCTAssertEqual(viewModel.availableCrops.count, 31)
        XCTAssertTrue(viewModel.availableCrops.contains("Corn"))
        XCTAssertTrue(viewModel.availableCrops.contains("Tomatoes"))
        XCTAssertTrue(viewModel.availableCrops.contains("Soybeans"))
        XCTAssertTrue(viewModel.availableCrops.contains("Sugar Beets"))
    }

    func testExperienceLevelsMatchWebApp() {
        let levels = ExperienceLevel.allCases
        XCTAssertEqual(levels.count, 4)
        XCTAssertEqual(levels[0].rawValue, "beginner")
        XCTAssertEqual(levels[1].rawValue, "intermediate")
        XCTAssertEqual(levels[2].rawValue, "advanced")
        XCTAssertEqual(levels[3].rawValue, "professional")
    }
}
