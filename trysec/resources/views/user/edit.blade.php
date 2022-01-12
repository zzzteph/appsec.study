@include('include.header')



	 <section class="section">
		 <div class="container">

<form method="POST" enctype="multipart/form-data" action="{{route('update-user-page',['id' => $user->id])}}">

	 @method('PUT')
	@csrf
<div class="field">
  <label class="label">Name</label>
  <div class="control">

		<input class="input" type="text" name="name" value="{{$user->name}}">

	
  </div>
</div>





<div class="field">
  <div class="control">
  @if (isset($user->avatar))
	  <figure class="image is-128x128">
<img src="{{$user->avatar}}">  
</figure>
  @endif
  </div>
</div>


  <div class="field">
  <div class="control">
<div class="file has-name">
  <label class="file-label">
    <input class="file-input" type="file" name="avatar">
    <span class="file-cta">
      <span class="file-icon">
        <i class="fas fa-upload"></i>
      </span>
      <span class="file-label">
        Choose a file…
      </span>
    </span>
    <span class="file-name">
     
    </span>
  </label>
</div>
  </div>
</div>

<div class="field">
  <div class="control">
    <button class="button is-success is-large">Save</button>
  </div>
</div>
</form>


    </div>

    </section>





@include('include.footer')