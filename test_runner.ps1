Write-Host "=== 1. TEST REGISTRATION ==="
$regBody = @{
    name = "Test Student"
    email = "test.student@campus.edu"
    password = "Password123!"
    confirmPassword = "Password123!"
    phone = "555-9999"
    campusName = "East Quad"
} | ConvertTo-Json

$regResp = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $regBody -ContentType "application/json"
Write-Host "Registered successfully. Token received:" ($regResp.token.Substring(0, 20) + "...")
Write-Host "User ID:" $regResp.user.id "Name:" $regResp.user.name

Write-Host "`n=== 2. TEST DUPLICATE REGISTRATION (CONFLICT / 400) ==="
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/auth/register" -Method Post -Body $regBody -ContentType "application/json"
    Write-Host "ERROR: Should have failed!"
} catch {
    Write-Host "Success: Duplicate prevented properly." $_.Exception.Message
}

Write-Host "`n=== 3. TEST LOGIN ==="
$loginBody = @{
    email = "test.student@campus.edu"
    password = "Password123!"
} | ConvertTo-Json
$loginResp = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$studentToken = $loginResp.token
Write-Host "Login successful. Token validated."

Write-Host "`n=== 4. TEST INVALID LOGIN ==="
try {
    $badLogin = @{ email = "test.student@campus.edu"; password = "WrongPassword" } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $badLogin -ContentType "application/json"
    Write-Host "ERROR: Should have failed!"
} catch {
    Write-Host "Success: Invalid password rejected." $_.Exception.Message
}

Write-Host "`n=== 5. TEST CREATE LISTING (AS TEST STUDENT) ==="
$headers = @{ Authorization = "Bearer $studentToken" }
$newListingBody = @{
    title = "Organic Chemistry 3rd Edition"
    description = "David Klein Organic Chemistry textbook. Clean pages, no highlighting."
    price = 55.00
    category = "BOOKS"
    conditionType = "Like New"
    isbn = "9781119659594"
    author = "David Klein"
    pickupLocation = "Science Library"
    imageUrl = "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c"
} | ConvertTo-Json
$createdListing = Invoke-RestMethod -Uri "http://localhost:8080/api/listings" -Method Post -Body $newListingBody -Headers $headers -ContentType "application/json"
$createdId = $createdListing.id
Write-Host "Created listing ID:" $createdId "Title:" $createdListing.title "Status:" $createdListing.status

Write-Host "`n=== 6. TEST GET LISTING DETAILS ==="
$fetched = Invoke-RestMethod -Uri "http://localhost:8080/api/listings/$createdId" -Method Get
Write-Host "Fetched listing:" $fetched.title "Price:" $fetched.price "Seller:" $fetched.sellerName

Write-Host "`n=== 7. TEST EDIT OWN LISTING (OWNER) ==="
$updateBody = @{
    title = "Organic Chemistry 3rd Edition (Updated Cheat Sheet Included)"
    description = "David Klein Organic Chemistry textbook. Clean pages, includes laminated reaction roadmaps."
    price = 50.00
    category = "BOOKS"
    conditionType = "Like New"
    isbn = "9781119659594"
    author = "David Klein"
    pickupLocation = "Science Library"
} | ConvertTo-Json
$updatedListing = Invoke-RestMethod -Uri "http://localhost:8080/api/listings/$createdId" -Method Put -Body $updateBody -Headers $headers -ContentType "application/json"
Write-Host "Updated successfully. New title:" $updatedListing.title "New Price:" $updatedListing.price

Write-Host "`n=== 8. TEST MARK OWN LISTING AS SOLD (OWNER) ==="
$soldListing = Invoke-RestMethod -Uri "http://localhost:8080/api/listings/$createdId/sold" -Method Patch -Headers $headers
Write-Host "Marked sold successfully. Status is now:" $soldListing.status

Write-Host "`n=== 9. TEST OWNERSHIP AUTHORIZATION ENFORCEMENT (CRITICAL REQUIREMENT 15) ==="
# Login as another student (Alex Rivera, who owns listing 1)
$alexLoginBody = @{ email = "alex@campus.edu"; password = "Password123!" } | ConvertTo-Json
$alexLoginResp = Invoke-RestMethod -Uri "http://localhost:8080/api/auth/login" -Method Post -Body $alexLoginBody -ContentType "application/json"
$alexToken = $alexLoginResp.token
$alexHeaders = @{ Authorization = "Bearer $alexToken" }

Write-Host "Attempting unauthorized EDIT of Test Student's listing ($createdId) by Alex..."
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/listings/$createdId" -Method Put -Body $updateBody -Headers $alexHeaders -ContentType "application/json"
    Write-Host "CRITICAL SECURITY FLAW: Alex was able to edit Test Student's listing!"
} catch {
    Write-Host "SUCCESS: Backend rejected unauthorized edit with:" $_.Exception.Message
}

Write-Host "Attempting unauthorized DELETE of Test Student's listing ($createdId) by Alex..."
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/listings/$createdId" -Method Delete -Headers $alexHeaders
    Write-Host "CRITICAL SECURITY FLAW: Alex was able to delete Test Student's listing!"
} catch {
    Write-Host "SUCCESS: Backend rejected unauthorized delete with:" $_.Exception.Message
}

Write-Host "Attempting unauthorized MARK SOLD of Test Student's listing ($createdId) by Alex..."
try {
    Invoke-RestMethod -Uri "http://localhost:8080/api/listings/$createdId/sold" -Method Patch -Headers $alexHeaders
    Write-Host "CRITICAL SECURITY FLAW: Alex was able to mark sold Test Student's listing!"
} catch {
    Write-Host "SUCCESS: Backend rejected unauthorized mark-sold with:" $_.Exception.Message
}

Write-Host "`n=== 10. TEST DELETE OWN LISTING (OWNER) ==="
$delResp = Invoke-RestMethod -Uri "http://localhost:8080/api/listings/$createdId" -Method Delete -Headers $headers
Write-Host "Deleted successfully:" $delResp.message

Write-Host "`n=== 11. TEST SEARCH & FILTER ==="
$calcSearch = Invoke-RestMethod -Uri "http://localhost:8080/api/listings?search=calculator" -Method Get
Write-Host "Search for 'calculator' returned count:" $calcSearch.Count "First title:" $calcSearch[0].title

$bookFilter = Invoke-RestMethod -Uri "http://localhost:8080/api/listings?category=BOOKS" -Method Get
Write-Host "Filter by category BOOKS returned count:" $bookFilter.Count

$priceSort = Invoke-RestMethod -Uri "http://localhost:8080/api/listings?sort=price_asc" -Method Get
Write-Host "Sort price_asc lowest item:" $priceSort[0].title "Price:" $priceSort[0].price
Write-Host "Sort price_asc highest item:" $priceSort[-1].title "Price:" $priceSort[-1].price
