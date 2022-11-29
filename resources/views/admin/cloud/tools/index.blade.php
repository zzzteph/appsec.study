@include('include.header')



	 <section class="section">
		 <div class="container">
 
@if (isset($toolvm->id))
	<form method="POST" action="{{route('update-admin-tools')}}">
    @csrf
	 @method('PUT')
	@else 
	 <form method="POST"  action="{{route('create-admin-tools')}}">
    @csrf
	 
	@endif
<h1 class="title">Tools VM config</h1>
<div class="field">
  <label class="label">Name</label>
  <div class="control">
	@if (isset($toolvm->name))
  
	
		<input class="input" type="text" name="name" value="{{$toolvm->name}}">
	
	@else
		<input class="input" type="text" placeholder="vm name" name="name" value="">
	@endif
	
  </div>
</div>




<div class="field">
  <div class="control">
    <button class="button is-success is-large">Save</button>
  </div>
</div>
</form>
<hr/>
@if (isset($toolvm->id))
					<form method="POST" action="{{route('delete-admin-tools')}}">
					@csrf
					 @method('DELETE')
				 <input type="hidden" name="id" value="{{$toolvm->id}}">
					 <button class="button is-danger">Delete</button>
					 </form>
@endif
    </div>

    </section>



@include('include.footer')